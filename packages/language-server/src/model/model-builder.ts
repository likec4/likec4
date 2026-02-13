import {
  type LayoutedView,
  type ProjectId,
  type UnknownComputed,
  type UnknownParsed,
  type ViewId,
  _stage,
} from '@likec4/core'
import { computeView } from '@likec4/core/compute-view'
import { LikeC4Model } from '@likec4/core/model'
import type * as c4 from '@likec4/core/types'
import { loggable } from '@likec4/log'
import { deepEqual as eq } from 'fast-equals'
import {
  type DocumentBuilder,
  type LangiumDocument,
  type URI,
  type WorkspaceLock,
  Disposable,
  DocumentState,
  interruptAndCheck,
  WorkspaceCache,
} from 'langium'
import {
  filter,
  hasAtLeast,
  identity,
  map,
  mapToObj,
  piped,
  values,
} from 'remeda'
import type { CancellationToken } from 'vscode-jsonrpc'
import type { LikeC4ManualLayouts, ManualLayoutsSnapshot } from '../filesystem'
import { isNotLikeC4Builtin } from '../likec4lib'
import { logger as mainLogger } from '../logger'
import type { LikeC4Services } from '../module'
import { ADisposable, performanceMark } from '../utils'
import { assignNavigateTo } from '../view-utils'
import type { ProjectsManager } from '../workspace'
import { type BuildModelData, buildModelData } from './builder/buildModel'
import type { LastSeenArtifacts } from './last-seen-artifacts'
import type { LikeC4ModelParser } from './model-parser'

const parsedWithoutImportsCacheKey = (projectId: c4.ProjectId) => `parsed-without-imports-${projectId}`
const parsedModelCacheKey = (projectId: c4.ProjectId) => `parsed-model-${projectId}`
const computedModelCacheKey = (projectId: c4.ProjectId) => `computed-model-${projectId}`

const builderLogger = mainLogger.getChild('builder')

type ModelParsedListener = (docs: URI[]) => void

type ManualLayouts = Record<ViewId, LayoutedView> | null

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
  private cache: WorkspaceCache<string, unknown>
  private DocumentBuilder: DocumentBuilder
  private manualLayouts: LikeC4ManualLayouts
  private mutex: WorkspaceLock
  private lastSeen: LastSeenArtifacts

  constructor(protected services: LikeC4Services) {
    super()
    this.projects = services.shared.workspace.ProjectsManager
    this.parser = services.likec4.ModelParser
    this.cache = services.shared.workspace.Cache
    this.DocumentBuilder = services.shared.workspace.DocumentBuilder
    this.mutex = services.shared.workspace.WorkspaceLock
    this.manualLayouts = services.shared.workspace.ManualLayouts
    this.lastSeen = services.likec4.LastSeen

    this.onDispose(
      this.DocumentBuilder.onUpdate((_changed, deleted) => {
        if (deleted.length > 0) {
          this.notifyListeners(deleted)
        }
      }),
      services.shared.workspace.WorkspaceManager.onForceCleanCache(() => {
        this.clearCache()
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
    const cache = this.cache as WorkspaceCache<string, BuildModelData | null>
    const key = parsedWithoutImportsCacheKey(projectId)
    return cache.get(key, () => {
      const logger = builderLogger.getChild(projectId)
      try {
        const project = this.projects.getProject(projectId)
        const docs = this.documents(projectId)
        if (docs.length === 0) {
          logger.debug`unsafeSyncParseModelData: skipped due to no documents`
          return null
        }
        logger.debug`unsafeSyncParseModelData: completed`
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
    const logger = builderLogger.getChild(projectId)
    const result = this.unsafeSyncParseModelData(projectId)
    if (!result) {
      return null
    }
    if (result.imports.size === 0) {
      return result.data
    }

    logger.debug`processing imports of ${projectId}`
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
  }

  public async parseModel(
    projectId?: c4.ProjectId | undefined,
    cancelToken?: CancellationToken,
  ): Promise<LikeC4Model<UnknownParsed>> {
    projectId = this.projects.ensureProjectId(projectId)
    const logger = builderLogger.getChild(projectId)
    const cache = this.cache as WorkspaceCache<string, LikeC4Model<UnknownParsed>>
    const t0 = performanceMark()
    return await this.mutex.read(async () => {
      if (cancelToken?.isCancellationRequested) {
        await interruptAndCheck(cancelToken)
      }
      const key = parsedModelCacheKey(projectId)
      if (cache.has(key)) {
        logger.debug`parseModel from cache`
      }
      return cache.get(key, () => {
        const parsedModel = this.unsafeSyncJoinedModelData(projectId)
        if (!parsedModel) {
          logger.debug`parseModel: returning EMPTY`
          return LikeC4Model.EMPTY.asParsed
        }
        logger.debug`parseModel in ${t0.pretty}`
        return LikeC4Model.create(parsedModel)
      })
    })
  }

  private previousViews: Record<string, c4.ComputedView> = {}

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
    const cache = this.cache as WorkspaceCache<string, LikeC4Model<UnknownComputed>>
    const key = computedModelCacheKey(projectId) + (manualLayouts?.hash ?? '')
    return cache.get(key, () => {
      const logger = builderLogger.getChild(projectId)
      const parsedModelData = this.unsafeSyncJoinedModelData(projectId)
      if (!parsedModelData) {
        logger.debug`unsafeSyncComputeModel: returning EMPTY`
        return LikeC4Model.EMPTY.asComputed
      }
      const parsedModel = LikeC4Model.create(parsedModelData)
      const allViews = [] as c4.ComputedView[]
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
        allViews.push(result.view)
      }
      assignNavigateTo(allViews)
      const views = mapToObj(allViews, v => {
        const key = computedViewKey(projectId, v.id)
        const previous = this.previousViews[key]
        const view = previous && eq(v, previous) ? previous : v
        this.previousViews[key] = view
        return [v.id, view] as const
      })
      const data: c4.ComputedLikeC4ModelData = {
        ...parsedModelData,
        manualLayouts: { ...manualLayouts?.views },
        [_stage]: 'computed',
        views,
      }
      logger.debug(`unsafeSyncComputeModel${manualLayouts ? ' with manual layouts' : ''}: completed`)
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
    const t0 = performanceMark()
    return await this.mutex.read(async () => {
      if (cancelToken?.isCancellationRequested) {
        await interruptAndCheck(cancelToken)
      }
      const project = this.projects.getProject(projectId)
      const manualLayouts = await this.manualLayouts.read(project)
      const result = this.unsafeSyncComputeModel(projectId, manualLayouts)
      if (result === LikeC4Model.EMPTY) {
        logger.debug(`computeModel returned EMPTY`)
      } else if (t0.ms > 10) {
        logger.debug(`computeModel completed in ${t0.pretty}`)
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
    builderLogger.debug(`clearCache`)
    this.cache.clear()
    this.previousViews = {}
  }

  private documents(projectId: c4.ProjectId) {
    return this.parser.documents(projectId).toArray()
  }

  private notifyListeners(docs: URI[]) {
    for (const listener of this.listeners) {
      try {
        listener(docs)
      } catch (e) {
        builderLogger.warn(loggable(e))
      }
    }
  }
}

function computedViewKey(projectId: c4.ProjectId, viewId: string): string {
  return `computed-view-${projectId}-${viewId}`
}
