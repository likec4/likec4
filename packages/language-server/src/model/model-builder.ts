import {
  type ProjectId,
  type UnknownComputed,
  type UnknownParsed,
  _stage,
} from '@likec4/core'
import { computeView } from '@likec4/core/compute-view'
import { LikeC4Model } from '@likec4/core/model'
import type * as c4 from '@likec4/core/types'
import { loggable } from '@likec4/log'
import {
  type DocumentBuilder,
  type LangiumDocument,
  type URI,
  type WorkspaceLock,
  ContextCache,
  Disposable,
  DocumentState,
  interruptAndCheck,
  UriUtils,
} from 'langium'
import {
  entries,
  filter,
  groupBy,
  hasAtLeast,
  identity,
  indexBy,
  isArray,
  map,
  pipe,
  piped,
  prop,
  unique,
  values,
} from 'remeda'
import type { CancellationToken } from 'vscode-jsonrpc'
import type { LikeC4ManualLayouts, ManualLayoutsSnapshot } from '../filesystem'
import { isNotLikeC4Builtin } from '../likec4lib'
import { logger as mainLogger } from '../logger'
import type { LikeC4Services } from '../module'
import { ADisposable, performanceMark } from '../utils'
import { assignNavigateTo } from '../view-utils'
import type { Project, ProjectsManager } from '../workspace'
import { type BuildModelData, buildModelData } from './builder/buildModel'
import type { LastSeenArtifacts } from './last-seen-artifacts'
import type { LikeC4ModelParser } from './model-parser'

const builderLogger = mainLogger.getChild('builder')

type ModelParsedListener = (projectId: ProjectId, docs: URI[]) => void

export interface LikeC4ModelBuilder extends Disposable {
  parseModel(
    projectId?: ProjectId | undefined,
    cancelToken?: CancellationToken,
  ): Promise<LikeC4Model<UnknownParsed> | null>
  unsafeSyncComputeModel(projectId: ProjectId): LikeC4Model<UnknownComputed>
  computeModel(
    projectId?: ProjectId | undefined,
    cancelToken?: CancellationToken,
  ): Promise<LikeC4Model<UnknownComputed>>
  onModelParsed(callback: ModelParsedListener): Disposable
  // rebuildProject(projectId?: c4.ProjectId | undefined): Promise<void>
  clearCache(): void
}

export class DefaultLikeC4ModelBuilder extends ADisposable implements LikeC4ModelBuilder {
  private projects: ProjectsManager
  private parser: LikeC4ModelParser
  private listeners: ModelParsedListener[] = []
  private cache: ProjectModelCache
  private DocumentBuilder: DocumentBuilder
  private manualLayouts: LikeC4ManualLayouts
  private mutex: WorkspaceLock
  private lastSeen: LastSeenArtifacts

  constructor(protected services: LikeC4Services) {
    super()
    this.projects = services.shared.workspace.ProjectsManager
    this.parser = services.likec4.ModelParser
    this.DocumentBuilder = services.shared.workspace.DocumentBuilder
    this.mutex = services.shared.workspace.WorkspaceLock
    this.manualLayouts = services.shared.workspace.ManualLayouts
    this.lastSeen = services.likec4.LastSeen
    this.cache = new ProjectModelCache(services)

    this.onDispose(
      this.cache,
      this.DocumentBuilder.onUpdate((_changed, deleted) => {
        if (deleted.length > 0) {
          this.notifyListeners(deleted)
        }
      }),
      services.shared.workspace.WorkspaceManager.onForceCleanCache(() => {
        this.clearCache()
      }),
      // Emit DidChangeModelNotification, that leads to incoming calls to computeModel
      this.manualLayouts.onManualLayoutUpdate(({ projectId }) => {
        this.notifyListeners(projectId)
      }),
    )

    const filterValidatedDocs = piped(
      identity()<LangiumDocument[]>,
      filter(d => isNotLikeC4Builtin(d) && !this.projects.isExcluded(d)),
      map(d => d.uri),
    )

    this.onDispose(
      this.DocumentBuilder.onBuildPhase(
        DocumentState.Validated,
        (docs, _cancelToken) => {
          const validated = filterValidatedDocs(docs)
          if (validated.length > 0) {
            this.notifyListeners(validated)
          }
        },
      ),
    )
    builderLogger.debug`created`
  }

  /**
   * WARNING:
   * This method is internal and should to be called only when all documents are known to be parsed.
   * Otherwise, the model may be incomplete.
   *
   * To avoid circular dependencies, we do not resolve imports here.
   */
  private unsafeSyncParseModelData(projectId: c4.ProjectId): BuildModelData | null {
    return this.cache.parsedData(projectId, () => {
      const logger = builderLogger.getChild(projectId)
      try {
        const project = this.projects.getProject(projectId)
        const docs = this.documents(projectId)
        if (docs.length === 0) {
          logger.trace`unsafeSyncParseModelData: ${'skipped due to no documents'}`
          return null
        }
        logger.debug`unsafeSyncParseModelData: ${'completed'}`
        return buildModelData(this.services, project, docs)
      } catch (err) {
        builderLogger.warn(`unsafeSyncParseModelData failed for project ${projectId}`, { err })
        return null
      }
    })
  }

  /**
   * To avoid circular dependencies, first we parse all documents and then we join them.
   */
  private unsafeSyncJoinedModelData(
    projectId: c4.ProjectId,
  ): c4.ParsedLikeC4ModelData | null {
    return this.cache.parsedJoinedData(projectId, () => {
      const logger = builderLogger.getChild(projectId)
      const result = this.unsafeSyncParseModelData(projectId)
      if (!result) {
        return null
      }
      if (result.imports.size === 0) {
        logger.trace(`unsafeSyncJoinedModelData: no imports`)
        return result.data
      }

      logger.debug(`unsafeSyncJoinedModelData: processing imports`)
      const imports = [...result.imports.associations()].reduce((acc, [projectId, fqns]) => {
        if (fqns.size === 0) {
          return acc
        }
        const anotherProject = this.unsafeSyncParseModelData(projectId)
        if (anotherProject) {
          const imported = [...fqns].flatMap(fqn => anotherProject.data.elements[fqn] ?? [])
          if (hasAtLeast(imported, 1)) {
            acc[projectId] = structuredClone(imported)
          }
        }
        return acc
      }, {} as c4.ParsedLikeC4ModelData['imports'])
      return {
        ...result.data,
        imports,
      }
    })
  }

  public async parseModel(
    projectId?: c4.ProjectId | undefined,
    cancelToken?: CancellationToken,
  ): Promise<LikeC4Model<UnknownParsed>> {
    projectId = this.projects.ensureProjectId(projectId)
    return await this.mutex.read(async () => {
      if (cancelToken?.isCancellationRequested) {
        await interruptAndCheck(cancelToken)
      }
      return this.cache.parsedModel(projectId, () => {
        const logger = builderLogger.getChild(projectId)
        const parsedModel = this.unsafeSyncJoinedModelData(projectId)
        if (!parsedModel) {
          logger.debug`parseModel: returning EMPTY`
          return LikeC4Model.EMPTY.asParsed
        }
        return LikeC4Model.create(parsedModel)
      })
    })
  }

  /**
   * WARNING:
   * This method is internal and should to be called only when all documents are known to be parsed.
   * Otherwise, the model may be incomplete.
   *
   * @internal
   */
  public unsafeSyncComputeModel(
    projectId: c4.ProjectId,
    manualLayouts?: ManualLayoutsSnapshot | null,
  ): LikeC4Model<UnknownComputed> {
    return this.cache.computedModel(projectId, manualLayouts ?? null, () => {
      const logger = builderLogger.getChild(projectId)
      const parsedModelData = this.unsafeSyncJoinedModelData(projectId)
      if (!parsedModelData) {
        logger.warn`unsafeSyncComputeModel: returning EMPTY`
        return LikeC4Model.EMPTY.asComputed
      }
      const t0 = performanceMark()
      const parsedModel = LikeC4Model.create(parsedModelData)
      const views = [] as c4.ComputedView[]
      for (const view of values(parsedModelData.views)) {
        const result = computeView(view, parsedModel)
        if (!result.isSuccess) {
          logger.warn(loggable(result.error))
          continue
        }
        if (manualLayouts?.views[view.id]) {
          Object.assign(
            result.view,
            // satisfies enforces that the object has the property
            { hasManualLayout: true } satisfies Partial<c4.ComputedView>,
          )
        }
        views.push(result.view)
      }
      assignNavigateTo(views)
      const data: c4.ComputedLikeC4ModelData = {
        ...parsedModelData,
        manualLayouts: { ...manualLayouts?.views },
        [_stage]: 'computed',
        views: indexBy(views, prop('id')),
      }
      logger.debug(`unsafeSyncComputeModel${manualLayouts ? ' with manual layouts' : ''}: {status} in ${t0.pretty}`, {
        status: 'completed',
      })
      return this.lastSeen.rememberModel(
        LikeC4Model.create(data),
      )
    })
  }

  public async computeModel(
    projectId?: c4.ProjectId | undefined,
    cancelToken?: CancellationToken,
  ): Promise<LikeC4Model<UnknownComputed>> {
    projectId = this.projects.ensureProjectId(projectId)
    const logger = builderLogger.getChild(projectId)
    return await this.mutex.read(async () => {
      if (cancelToken?.isCancellationRequested) {
        await interruptAndCheck(cancelToken)
      }
      const project = this.projects.getProject(projectId)
      const manualLayouts = await this.manualLayouts.read(project)
      const result = this.unsafeSyncComputeModel(projectId, manualLayouts)
      if (result === LikeC4Model.EMPTY) {
        logger.warn(`computeModel returned EMPTY`)
      }
      return result
    })
  }

  public onModelParsed(callback: ModelParsedListener): Disposable {
    this.listeners.push(callback)
    return Disposable.create(() => {
      const index = this.listeners.indexOf(callback)
      if (index >= 0) {
        this.listeners.splice(index, 1)
      }
    })
  }

  public clearCache(): void {
    builderLogger.debug(`clear all caches`)
    this.cache.clear()
  }

  private documents(projectId: c4.ProjectId) {
    return this.parser.documents(projectId).toArray()
  }

  private notifyListeners(docs: URI[]): void
  private notifyListeners(projectId: c4.ProjectId): void
  private notifyListeners(arg: URI[] | c4.ProjectId) {
    let groupedByProject: Array<[projectId: c4.ProjectId, docs: URI[]]>
    if (isArray(arg)) {
      groupedByProject = pipe(
        arg,
        groupBy((doc) => this.projects.ownerProjectId(doc)),
        entries(),
      )
    } else {
      groupedByProject = [
        [arg, []],
      ]
    }
    for (const listener of this.listeners) {
      try {
        for (const [projectId, docs] of groupedByProject) {
          listener(projectId, docs)
        }
      } catch (e) {
        builderLogger.warn(loggable(e))
      }
    }
  }
}
/**
 * Every key/value pair in this cache is scoped to the whole workspace.
 * If any document in the workspace is added, changed or deleted, the whole cache is evicted.
 */
type CacheKey =
  | 'parsed-data'
  | 'parsed-joined-data'
  | 'parsed-model'
  | `computed-model`
  | `computed-model-${string}`
  | `uri-${string}`

class ProjectModelCache extends ContextCache<ProjectId | Project, CacheKey, unknown, ProjectId> {
  constructor(services: LikeC4Services) {
    super((project) => {
      if (typeof project === 'string') {
        return project
      }
      return project.id
    })

    this.toDispose.push(services.shared.workspace.DocumentBuilder.onDocumentPhase(DocumentState.Validated, (doc) => {
      const pm = services.shared.workspace.ProjectsManager
      const project = pm.getProject(doc)
      const projectCache = this.cacheForContext(project.id)
      if (projectCache.size > 0) {
        builderLogger.trace`clear project cache ${project.id} (on validated ${
          UriUtils.relative(project.folderUri, doc.uri)
        })`
        projectCache.clear()
      }
    }))
    this.toDispose.push(services.shared.workspace.DocumentBuilder.onUpdate((_changed, deleted) => {
      if (deleted.length > 0) { // react only on deleted documents
        const pm = services.shared.workspace.ProjectsManager
        const projects = unique(map(deleted, pm.ownerProjectId.bind(pm)))
        if (!hasAtLeast(projects, 1)) {
          return
        }
        builderLogger.trace`clear project caches for: ${projects} (on delete ${deleted.map(d => d.fsPath)})`
        for (const project of projects) {
          this.clear(project)
        }
      }
    }))
  }

  parsedData<R>(project: ProjectId, provider: () => R): R {
    const key = 'parsed-data'
    const existing = this.get(project, key)
    if (existing !== undefined) {
      builderLogger.trace`cache hit project ${project} key: ${key}`
      return existing as R
    }
    const result = provider()
    this.set(project, key, result)
    builderLogger.trace`cache miss project ${project} key: ${key}`
    return result
  }

  parsedJoinedData<R>(project: ProjectId, provider: () => R): R {
    const key = 'parsed-joined-data'
    const existing = this.get(project, key)
    if (existing !== undefined) {
      builderLogger.trace`cache hit project ${project} key: ${key}`
      return existing as R
    }
    const result = provider()
    this.set(project, key, result)
    builderLogger.trace`cache miss project ${project} key: ${key}`
    return result
  }

  parsedModel<R>(project: ProjectId, compute: () => R): R {
    const key = 'parsed-model'
    const existing = this.get(project, key)
    if (existing !== undefined) {
      builderLogger.trace`cache hit project ${project} key: ${key}`
      return existing as R
    }
    const result = compute()
    this.set(project, key, result)
    builderLogger.trace`cache miss project ${project} key: ${key}`
    return result
  }

  computedModel<R>(
    project: ProjectId,
    manualLayouts: ManualLayoutsSnapshot | null,
    compute: () => R,
  ): R {
    const cacheKey: CacheKey = manualLayouts ? `computed-model-${manualLayouts.hash}` : 'computed-model'
    const existing = this.get(project, cacheKey)
    if (existing !== undefined) {
      builderLogger.trace`cache hit project ${project} key: ${cacheKey}`
      return existing as R
    }
    const result = compute()
    this.set(project, cacheKey, result)
    builderLogger.trace`cache miss project ${project} key: ${cacheKey}`
    return result
  }
}
