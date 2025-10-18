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
  type URI,
  type WorkspaceLock,
  Disposable,
  DocumentState,
  interruptAndCheck,
  WorkspaceCache,
} from 'langium'
import {
  flatMap,
  hasAtLeast,
  isEmpty,
  mapToObj,
  pipe,
  values,
} from 'remeda'
import type { CancellationToken } from 'vscode-jsonrpc'
import { isLikeC4Builtin } from '../likec4lib'
import { logger as mainLogger } from '../logger'
import type { LikeC4Services } from '../module'
import { ADisposable, performanceMark } from '../utils'
import { assignNavigateTo } from '../view-utils'
import type { LikeC4ManualLayouts } from '../views'
import type { ProjectsManager } from '../workspace'
import { type BuildModelData, buildModelData } from './builder/buildModel'
import type { LikeC4ModelParser } from './model-parser'

const parsedWithoutImportsCacheKey = (projectId: c4.ProjectId) => `parsed-without-imports-${projectId}`
const parsedModelCacheKey = (projectId: c4.ProjectId) => `parsed-model-${projectId}`
const computedModelCacheKey = (projectId: c4.ProjectId) => `computed-model-${projectId}`

const builderLogger = mainLogger.getChild('model-builder')

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

  constructor(services: LikeC4Services) {
    super()
    this.projects = services.shared.workspace.ProjectsManager
    this.parser = services.likec4.ModelParser
    this.cache = services.shared.workspace.Cache
    this.DocumentBuilder = services.shared.workspace.DocumentBuilder
    this.mutex = services.shared.workspace.WorkspaceLock
    this.manualLayouts = services.likec4.ManualLayouts

    this.onDispose(
      this.DocumentBuilder.onUpdate((_changed, deleted) => {
        if (deleted.length > 0) {
          this.notifyListeners(deleted)
        }
      }),
    )
    this.onDispose(
      this.DocumentBuilder.onBuildPhase(
        DocumentState.Validated,
        (docs, _cancelToken) => {
          const validated = docs.flatMap(d => isLikeC4Builtin(d.uri) || this.projects.checkIfExcluded(d) ? [] : d.uri)
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
    const logger = builderLogger.getChild(projectId)
    const key = parsedWithoutImportsCacheKey(projectId)
    if (cache.has(key)) {
      logger.debug`unsafeSyncParseModelData from cache`
    }
    return cache.get(key, () => {
      try {
        const project = this.projects.getProject(projectId)
        const docs = this.documents(projectId)
        if (docs.length === 0) {
          logger.debug`no documents to build model`
          return null
        }
        logger.debug`unsafeSyncParseModelData`
        return buildModelData(project, docs)
      } catch (err) {
        builderLogger.warn(`unsafeSyncParseModelData failed for project ${projectId}`, { err })
        return null
      }
    })
  }

  /**
   * To avoid circular dependencies, first we parse all documents and then we join them.
   */
  private unsafeSyncJoinedModel(
    projectId: c4.ProjectId,
  ): LikeC4Model<UnknownParsed> | null {
    const logger = builderLogger.getChild(projectId)
    const cache = this.cache as WorkspaceCache<string, LikeC4Model<UnknownParsed> | null>
    const key = parsedModelCacheKey(projectId)
    if (cache.has(key)) {
      logger.debug`unsafeSyncJoinedModel from cache`
    }
    return cache.get(key, () => {
      const result = this.unsafeSyncParseModelData(projectId)
      if (!result) {
        return null
      }
      let parsedData = result.data
      if (result.imports.size > 0) {
        logger.debug`processing imports of ${projectId}`
        const imports = [...result.imports.associations()].reduce((acc, [projectId, fqns]) => {
          const anotherProject = this.unsafeSyncParseModelData(projectId)
          if (anotherProject) {
            const imported = pipe(
              [...fqns],
              flatMap(fqn => anotherProject.data.elements[fqn] ?? []),
            )
            if (hasAtLeast(imported, 1)) {
              acc[projectId] = imported
            }
          }
          return acc
        }, {} as c4.ParsedLikeC4ModelData['imports'])
        parsedData = {
          ...result.data,
          imports,
        }
      }
      return LikeC4Model.create(parsedData)
    })
  }

  public async parseModel(
    projectId?: c4.ProjectId | undefined,
    cancelToken?: CancellationToken,
  ): Promise<LikeC4Model<UnknownParsed> | null> {
    projectId = this.projects.ensureProjectId(projectId)
    const logger = builderLogger.getChild(projectId)
    const t0 = performanceMark()
    return await this.mutex.read(async () => {
      if (cancelToken?.isCancellationRequested) {
        await interruptAndCheck(cancelToken)
      }
      const parsedModel = this.unsafeSyncJoinedModel(projectId)
      logger.debug`parseModel in ${t0.pretty}`
      return parsedModel
    })
  }

  private previousViews: Record<string, c4.ComputedView> = {}

  /**
   * WARNING:
   * This method is internal and should to be called only when all documents are known to be parsed.
   * Otherwise, the model may be incomplete.
   */
  public unsafeSyncComputeModel(
    projectId: c4.ProjectId,
    manualLayouts?: ManualLayouts,
  ): LikeC4Model<UnknownComputed> {
    const logger = builderLogger.getChild(projectId)
    const cache = this.cache as WorkspaceCache<string, LikeC4Model<UnknownComputed>>
    const viewsCache = this.cache as WorkspaceCache<string, c4.ComputedView | null>
    const hasManualLayouts = !!manualLayouts && !isEmpty(manualLayouts)
    const key = computedModelCacheKey(projectId) + (hasManualLayouts ? '+manualLayouts' : '')
    if (cache.has(key)) {
      logger.debug`unsafeSyncBuildModel from cache`
    }
    return cache.get(key, () => {
      const parsedModel = this.unsafeSyncJoinedModel(projectId)
      if (!parsedModel) {
        return LikeC4Model.EMPTY.asComputed
      }
      const allViews = [] as c4.ComputedView[]
      for (const view of values(parsedModel.$data.views)) {
        const result = computeView(view, parsedModel)
        if (!result.isSuccess) {
          logger.warn(loggable(result.error))
          continue
        }
        if (manualLayouts?.[view.id]) {
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
        viewsCache.set(key, view)
        return [v.id, view] as const
      })
      const data: c4.ComputedLikeC4ModelData = {
        ...parsedModel.$data,
        [_stage]: 'computed',
        views,
      }
      if (hasManualLayouts) {
        data.manualLayouts = manualLayouts
      }
      return LikeC4Model.create(data)
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
      logger.debug(`buildLikeC4Model in ${t0.pretty}`)
      return result
    })
  }

  // public async rebuildProject(projectId?: c4.ProjectId | undefined): Promise<void> {
  //   await this.mutex.write(async (token) => {
  //     projectId = this.projects.ensureProjectId(projectId)
  //     this.clearCache()
  //     builderLogger.debug(`rebuildProject ${projectId}`)
  //     const docs = this.documents(projectId).map(doc => doc.uri)
  //     await this.DocumentBuilder.update(docs, [], token)
  //   })
  // }

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
