// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import {
  type UnknownComputed,
  type UnknownParsed,
  _stage,
  _type,
  GlobalFqn,
  ProjectId,
} from '@likec4/core'
import { computeView } from '@likec4/core/compute-view'
import { LikeC4Model } from '@likec4/core/model'
import * as c4 from '@likec4/core/types'
import { LRUMap, objectHash, stringHash } from '@likec4/core/utils'
import { type Logger, loggable } from '@likec4/log'
import {
  type Cancellation,
  type DocumentBuilder,
  type LangiumDocument,
  type URI,
  type WorkspaceLock,
  Disposable,
  DocumentState,
  interruptAndCheck,
  SimpleCache,
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
  mapValues,
  pipe,
  piped,
  prop,
  unique,
  values,
} from 'remeda'
import { CancellationToken } from 'vscode-jsonrpc'
import { type ParsedLikeC4LangiumDocument, isLikeC4UserDocument } from '../ast'
import type { LikeC4ManualLayouts, ManualLayoutsSnapshot } from '../filesystem'
import { isNotLikeC4Builtin } from '../likec4lib'
import { logger as mainLogger } from '../logger'
import type { LikeC4Services } from '../module'
import { ADisposable, performanceMark } from '../utils'
import { assignNavigateTo } from '../view-utils'
import { type ProjectData, ProjectsManager } from '../workspace'
import { type BuildModelData, buildModelData } from './builder/buildModel'
import type { LastSeenArtifacts } from './last-seen-artifacts'
import type { LikeC4ModelParser } from './model-parser'

const builderLogger = mainLogger.getChild('builder')

type ModelParsedListener = (projectId: ProjectId, docs: URI[]) => void

function isRequestedImportedElement(fqns: ReadonlySet<c4.Fqn>, element: c4.Element): boolean {
  for (const fqn of fqns) {
    if (element.id === fqn || element.id.startsWith(`${fqn}.`)) {
      return true
    }
  }
  return false
}

function importedElementTitles(imports: c4.ParsedLikeC4ModelData['imports']): ReadonlyMap<string, string> {
  const titles = new Map<string, string>()
  for (const [projectId, elements] of entries(imports)) {
    for (const element of elements) {
      titles.set(GlobalFqn(projectId, element.id), element.title)
    }
  }
  return titles
}

function withImportedScopedViewTitles(
  views: c4.ParsedLikeC4ModelData['views'],
  imports: c4.ParsedLikeC4ModelData['imports'],
): c4.ParsedLikeC4ModelData['views'] {
  const titles = importedElementTitles(imports)
  if (titles.size === 0) {
    return views
  }
  return mapValues(views, view => {
    if (view[_type] === 'element' && view.title === null && view.viewOf) {
      const title = titles.get(view.viewOf)
      if (title !== undefined) {
        return {
          ...view,
          title,
        }
      }
    }
    return view
  })
}

type ProjectDocumentsCache =
  | {
    project: ProjectData
    hash: string
    docs: c4.NonEmptyArray<ParsedLikeC4LangiumDocument>
  }
  | {
    project: ProjectData
    hash: null
    docs?: never
  }

export interface LikeC4ModelBuilder extends Disposable {
  parseModel(
    projectId?: ProjectId | undefined,
    cancelToken?: Cancellation.CancellationToken,
  ): Promise<LikeC4Model<UnknownParsed> | null>
  unsafeSyncComputeModel(projectId: ProjectId): LikeC4Model<UnknownComputed>
  computeModel(
    projectId?: ProjectId | undefined,
    cancelToken?: Cancellation.CancellationToken,
  ): Promise<LikeC4Model<UnknownComputed>>
  onModelParsed(callback: ModelParsedListener): Disposable
  // rebuildProject(projectId?: c4.ProjectId | undefined): Promise<void>
  clearCache(): void
}

type Hashed<T> = { readonly hash: string; readonly value: T }

export class DefaultLikeC4ModelBuilder extends ADisposable implements LikeC4ModelBuilder {
  private readonly projects: ProjectsManager
  private readonly parser: LikeC4ModelParser
  private readonly listeners: ModelParsedListener[] = []
  private readonly cache?: any
  private readonly cache2: ProjectModelCache2
  private readonly DocumentBuilder: DocumentBuilder
  private readonly manualLayouts: LikeC4ManualLayouts
  private readonly mutex: WorkspaceLock
  private readonly lastSeen: LastSeenArtifacts

  constructor(protected services: LikeC4Services) {
    super()
    this.projects = services.shared.workspace.ProjectsManager
    this.parser = services.likec4.ModelParser
    this.DocumentBuilder = services.shared.workspace.DocumentBuilder
    this.mutex = services.shared.workspace.WorkspaceLock
    this.manualLayouts = services.shared.workspace.ManualLayouts
    this.lastSeen = services.likec4.LastSeen
    // this.cache = new ProjectModelCache(services)
    this.cache2 = new ProjectModelCache2(services)

    this.onDispose(
      // this.cache,
      this.cache2,
      Disposable.create(() => {
        this.listeners.length = 0
      }),
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

  private projectDocumentsCache(projectId: c4.ProjectId): ProjectDocumentsCache {
    const project = this.projects.getProject(projectId)
    return this.parser.documents(projectId).reduce(
      (acc, doc) => {
        if (acc === null) {
          return {
            project,
            hash: doc.likec4Parser.hash,
            docs: [doc],
          }
        }
        acc.hash = stringHash(acc.hash + doc.likec4Parser.hash)
        acc.docs.push(doc)
        return acc
      },
      null as null | Extract<ProjectDocumentsCache, { hash: string }>,
    ) ?? {
      project,
      hash: null,
    }
  }

  /**
   * WARNING:
   * This method is internal and should to be called only when all documents are known to be parsed.
   * Otherwise, the model may be incomplete.
   *
   * To avoid circular dependencies, we do not resolve imports here.
   */
  private unsafeSyncParseModelData(
    projectId: c4.ProjectId | ProjectDocumentsCache,
  ): Hashed<BuildModelData | null> | null {
    // const logger ?= builderLogger.getChild(projectId)
    const projectCache = typeof projectId === 'string' ? this.projectDocumentsCache(projectId) : projectId
    if (projectCache.hash === null) {
      return null
    }
    return this.cache2.buildData(
      projectCache.project.id,
      () => projectCache,
      ({ docs }) => {
        try {
          return buildModelData(this.services, projectCache.project, docs)
        } catch {
          return null
        }
      },
    )
  }

  /**
   * To avoid circular dependencies, first we parse all documents and then we join them.
   */
  private unsafeSyncJoinedModelData(
    projectId: c4.ProjectId,
  ): Hashed<c4.ParsedLikeC4ModelData> | null {
    const logger = builderLogger.getChild(projectId)

    return this.cache2.joinedData<Hashed<BuildModelData>>(
      projectId,
      () => {
        const { hash, value } = this.unsafeSyncParseModelData(projectId) ?? {}
        if (!hash || !value) {
          return null
        }

        return { hash, value }
      },
      ({ value: { imports, data } }) => {
        if (imports.size === 0) {
          logger.trace(`unsafeSyncJoinedModelData: no imports`)
          return data
        }

        const joinedImports = [...imports.associations()].reduce((acc, [projectId, fqns]) => {
          if (fqns.size === 0) {
            return acc
          }
          const anotherProject = this.unsafeSyncParseModelData(projectId)?.value?.data
          if (anotherProject) {
            const imported = values(anotherProject.elements).filter(element =>
              isRequestedImportedElement(fqns, element)
            )
            if (hasAtLeast(imported, 1)) {
              acc[projectId] = structuredClone(imported)
            }
          }
          return acc
        }, {} as c4.ParsedLikeC4ModelData['imports'])
        return ({
          ...data,
          imports: joinedImports,
          views: withImportedScopedViewTitles(data.views, joinedImports),
        })
      },
    )
  }

  /**
   * To avoid circular dependencies, first we parse all documents and then we join them.
   */
  private unsafeSyncParsedModel(
    projectId: c4.ProjectId,
  ): Hashed<LikeC4Model.Parsed> | null {
    return this.cache2.parsedModel(
      projectId,
      () => this.unsafeSyncJoinedModelData(projectId),
      ({ value }) => LikeC4Model.create(value),
    )
  }

  /**
   * To avoid circular dependencies, first we parse all documents and then we join them.
   */
  private unsafeSyncComputeData(
    projectId: c4.ProjectId,
    manualLayouts: ManualLayoutsSnapshot | null = null,
  ): Hashed<c4.ComputedLikeC4ModelData> | null {
    const logger = builderLogger.getChild(projectId)
    return this.cache2.computedData(
      projectId,
      () => {
        const parsedModel = this.unsafeSyncParsedModel(projectId)
        if (!parsedModel) {
          return null
        }
        const { hash, value } = parsedModel
        return {
          hash: manualLayouts ? objectHash([hash, manualLayouts.hash]) : hash,
          parsedModel: value,
          manualLayouts,
        }
      },
      ({ manualLayouts, parsedModel }) => {
        const t0 = performanceMark()
        const views = [] as c4.ComputedView[]
        for (const view of values(parsedModel.$data.views)) {
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
        logger.debug(`computeModel${manualLayouts ? ' with manual layouts' : ''}: {status} in ${t0.pretty}`, {
          status: 'completed',
        })
        return {
          ...parsedModel.$data,
          manualLayouts: { ...manualLayouts?.views },
          [_stage]: 'computed',
          views: indexBy(views, prop('id')),
        } as c4.ComputedLikeC4ModelData
      },
    )
  }

  public async parseModel(
    projectId?: c4.ProjectId | undefined,
    cancelToken?: CancellationToken,
  ): Promise<LikeC4Model<UnknownParsed>> {
    cancelToken ??= CancellationToken.None
    // await this.DocumentBuilder.waitUntil(DocumentState.Linked, cancelToken)
    projectId = this.projects.ensureProjectId(projectId)
    const logger = builderLogger.getChild(projectId)
    await interruptAndCheck(cancelToken)
    const parsedModel = this.unsafeSyncParsedModel(projectId)
    if (!parsedModel) {
      logger.debug`parseModel: returning EMPTY`
      return LikeC4Model.EMPTY.asParsed
    }
    return parsedModel.value
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
    manualLayouts: ManualLayoutsSnapshot | null = null,
  ): LikeC4Model<UnknownComputed> {
    const computedModel = this.cache2.computedModel(
      projectId,
      () => this.unsafeSyncComputeData(projectId, manualLayouts),
      ({ value }) => LikeC4Model.create(value),
    )
    if (computedModel) {
      return this.lastSeen.rememberModel(
        computedModel.value,
      )
    }
    return LikeC4Model.EMPTY.asComputed
  }

  public async computeModel(
    projectId?: c4.ProjectId | undefined,
    cancelToken?: CancellationToken,
  ): Promise<LikeC4Model<UnknownComputed>> {
    projectId = this.projects.ensureProjectId(projectId)
    const logger = builderLogger.getChild(projectId)
    const token = cancelToken ?? CancellationToken.None

    // await this.DocumentBuilder.waitUntil(DocumentState.Linked, token)
    return await this.mutex.read(async () => {
      await interruptAndCheck(token)
      const project = this.projects.getProject(projectId)
      const manualLayouts = await this.manualLayouts.read(project)
      const result = this.unsafeSyncComputeModel(projectId, manualLayouts)
      if (result === LikeC4Model.EMPTY && projectId !== ProjectsManager.DefaultProjectId) {
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
    if (this.listeners.length === 0) {
      return
    }
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
    // Copy listeners to avoid modification during iteration
    const listeners = this.listeners.slice()
    for (const listener of listeners) {
      for (const [projectId, docs] of groupedByProject) {
        try {
          listener(projectId, docs)
        } catch (e) {
          builderLogger.warn(loggable(e))
        }
      }
    }
  }
}
// /**
//  * Every key/value pair in this cache is scoped to the whole workspace.
//  * If any document in the workspace is added, changed or deleted, the whole cache is evicted.
//  */
// type CacheKey =
//   | `hash-${string}` // hash of validation errors for a document
//   | `parsed-data`
//   | 'parsed-joined-data'
//   | 'parsed-model'
//   | `computed-data`
//   | `computed-data-${string}`
//   | `computed-model`
//   | `computed-model-${string}`
//   | `uri-${string}`

// class ProjectModelCache extends ContextCache<ProjectId | Project, CacheKey, unknown, ProjectId> {
//   constructor(private services: LikeC4Services) {
//     super((project) => {
//       if (typeof project === 'string') {
//         return project
//       }
//       return project.id
//     })

//     const getProjectId = (doc: LangiumDocument) => {
//       if (isLikeC4LangiumDocument(doc) && doc.likec4ProjectId) {
//         return doc.likec4ProjectId
//       }
//       const pm = this.services.shared.workspace.ProjectsManager
//       return pm.ownerProjectId(doc)
//     }

//     this.toDispose.push(
//       // services.shared.workspace.DocumentBuilder.onDocumentResetBelow(DocumentState.Linked, ({ doc }) => {
//       //   this.clear(getProjectId(doc))
//       // }),
//       // services.shared.workspace.DocumentBuilder.onDocumentPhase(DocumentState.Validated, (doc) => {
//       //   if (isLikeC4LangiumDocument(doc)) {
//       //     const currentHash = calcValidationErrorsHash(doc)
//       //     const projectId = getProjectId(doc)
//       //     const cacheKey: CacheKey = `validation-hash-${doc.textDocument.uri}`
//       //     const lastHash = this.get(projectId, cacheKey) as string | undefined
//       //     if (lastHash !== currentHash) {
//       //       this.cacheForContext(projectId).keys()
//       //     }
//       //   }
//       // }),
//       services.shared.workspace.DocumentBuilder.onUpdate((_changed, deleted) => {
//         if (deleted.length > 0) { // react only on deleted documents
//           const pm = services.shared.workspace.ProjectsManager
//           const projects = unique(map(deleted, pm.ownerProjectId.bind(pm)))
//           if (!hasAtLeast(projects, 1)) {
//             return
//           }
//           builderLogger.trace`clear project caches for: ${projects} (on delete ${deleted.map(d => d.fsPath)})`
//           for (const project of projects) {
//             this.clear(project)
//           }
//         }
//       }),
//       Disposable.create(() => {
//         if (this.#timeout) {
//           clearTimeout(this.#timeout)
//           this.#timeout = undefined
//         }
//       }),
//     )
//   }

//   // #timeout: NodeJS.Timeout | undefined

//   #scheduleClear = funnel(
//     (accumulator: ProjectId | Record<ProjectId, number>) => {
//       if (typeof accumulator === 'string') {
//         return { [accumulator]: 1 }
//       }
//       return accumulator
//     },
//     {
//       reducer: (acc: Record<ProjectId, number> | ProjectId | undefined, project) => {
//         if (!acc) {
//           return project
//         }
//         if (typeof acc === 'string') {
//           acc = { [acc]: 1 }
//         }
//         acc[project] = (acc[project] ?? 0) + 1
//         return acc
//       },
//       maxBurstDurationMs: 5 * 60 * 1000, // 5 minutes
//     },
//   )

//   // #scheduleClear() {
//   //   if (this.#timeout) {
//   //     return
//   //   }
//   //   this.#timeout = setTimeout(() => {
//   //     this.#timeout = undefined
//   //     // Clear all caches
//   //     for (const project of this.services.shared.workspace.ProjectsManager.all) {
//   //       const ctx = this.cacheForContext(project)
//   //       for (const key of [...ctx.keys()].filter(isEvictionKey)) {
//   //         ctx.delete(key)
//   //       }
//   //     }
//   //   }, 30000) // 30 second delay
//   //   this.#timeout.unref()
//   // }

//   private getHashed<R>(project: ProjectId, key: CacheKey, hash: string, compute: () => R): Hashed<R> {
//     let existing = this.get(project, key) as Hashed<R> & { lastAccess: number } | undefined
//     if (!!existing && existing.hash === hash) {
//       builderLogger.trace`cache hit project ${project} key: ${key}`
//       existing.lastAccess = Date.now()
//       return { hash, value: existing.value }
//     }
//     // if (!existing) {
//     //   builderLogger.trace`cache miss project ${project} key: ${key} (no existing)`
//     // } else {
//     //   this.#scheduleClear(project)
//     //   builderLogger.trace`cache miss project ${project} key: ${key} (hash mismatch: ${existing.hash} !== ${hash})`
//     // }
//     // const result = { hash, value: compute() }
//     // this.set(project, key, result)
//     // return result
//   }

//   parsedData<R extends { hash: string }>(
//     project: ProjectId,
//     documents: Stream<ParsedLikeC4LangiumDocument>,
//     provider: (docs: ParsedLikeC4LangiumDocument[], hash: string) => R,
//   ): R {
//     const { hash, docs } = documents.reduce((acc, doc) => {
//       acc.hash = stringHash(acc.hash + doc.likec4Parser.hash)
//       acc.docs.push(doc)
//       return acc
//     }, {
//       hash: '',
//       docs: [] as ParsedLikeC4LangiumDocument[],
//     })
//     const key = 'parsed-data'
//     const existing = this.get(project, key) as R | undefined
//     if (!!existing && existing.hash === hash) {
//       builderLogger.trace`cache hit project ${project} key: ${key}`
//       return existing
//     }
//     if (!!existing) {
//       builderLogger.trace`cache hit (hash mismatch) project ${project} key: ${key}`
//     } else {
//       builderLogger.trace`cache miss project ${project} key: ${key}`
//     }
//     const result = provider(docs, hash)
//     if (result !== undefined) {
//       this.set(project, key, result)
//     }
//     return result
//   }

//   parsedJoinedData<R>(project: ProjectId, hash: string, compute: () => R): Hashed<R> {
//     return this.getHashed(project, 'parsed-joined-data', hash, compute)
//   }

//   parsedModel<R>(project: ProjectId, hash: string, compute: () => R): Hashed<R> {
//     return this.getHashed(project, 'parsed-model', hash, compute)
//   }

//   computedData<R>(
//     project: ProjectId,
//     hash: string,
//     manualLayouts: ManualLayoutsSnapshot | null,
//     compute: () => R,
//   ): Hashed<R> {
//     const cacheKey: CacheKey = manualLayouts ? `computed-data-${manualLayouts.hash}` : 'computed-data'
//     hash = manualLayouts ? objectHash([hash, manualLayouts.hash]) : hash
//     return this.getHashed(project, cacheKey, hash, compute)
//   }

//   computedModel<R>(
//     project: ProjectId,
//     hash: string,
//     manualLayouts: ManualLayoutsSnapshot | null,
//     compute: () => R,
//   ): Hashed<R> {
//     const cacheKey: CacheKey = manualLayouts ? `computed-model-${manualLayouts.hash}` : 'computed-model'
//     hash = manualLayouts ? objectHash([hash, manualLayouts.hash]) : hash
//     return this.getHashed(project, cacheKey, hash, compute)
//   }

//   protected clearOnValidationChange(project: ProjectId): void {
//     const ctx = this.cacheForContext(project)
//     for (const key of [...ctx.keys()]) {
//       if (!isValidationHashKey(key)) {
//         ctx.delete(key)
//       }
//     }
//   }
// }

// const isEvictionKey = (key: string): key is CacheKey => {
//   return key.startsWith('computed-data-') || key.startsWith('computed-model-') || key.startsWith('url-')
// }

// const isValidationHashKey = (key: string): key is `va:zlidation-hash-${string}` => {
//   return key.startsWith('validation-hash-')
// }

function getOrCreate<V>(params: {
  logger: Logger
  capacity?: number
  onReset?: () => void
}) {
  const map = new LRUMap<string, Hashed<V>>(params.capacity ?? 100)

  let latest: Hashed<V> | undefined

  return {
    reset: () => {
      if (latest) {
        params.logger.trace('reset')
        latest = undefined
        params.onReset?.()
      }
    },
    find: <K extends { hash: string }>(key: () => K | null, create: (key: K) => V) => {
      if (latest) {
        params.logger.trace('returning latest')
        return latest
      }
      const arg = key()
      if (!arg) {
        return null
      }
      let cached = map.get(arg.hash)
      if (!cached) {
        params.logger.trace('cache miss, creating new entry {hash}', { hash: arg.hash })
        cached = { hash: arg.hash, value: create(arg) }
        map.set(arg.hash, cached)
        params.logger.trace('entry created, cache size: {size}', { size: map.size })
      } else {
        params.logger.trace('cache hit for {hash}', { hash: arg.hash })
      }
      return latest = cached
    },
  }
}

function createProjectModelCache2(project: ProjectId) {
  const logger = builderLogger.getChild(project)
  const buildData = getOrCreate<BuildModelData | null>({
    logger: logger.getChild('buildData'),
    onReset: () => {
      joinedData.reset()
    },
  })
  const joinedData = getOrCreate<c4.ParsedLikeC4ModelData>({
    logger: logger.getChild('joinedData'),
    onReset: () => {
      parsedModel.reset()
      computedData.reset()
    },
  })
  const computedData = getOrCreate<c4.ComputedLikeC4ModelData>({
    logger: logger.getChild('computedData'),
    onReset: () => {
      computedModel.reset()
    },
  })
  const parsedModel = getOrCreate<LikeC4Model.Parsed>({
    logger: logger.getChild('parsedModel'),
    onReset: () => {
      computedModel.reset()
    },
  })
  const computedModel = getOrCreate<LikeC4Model.Computed>({
    logger: logger.getChild('computedModel'),
  })
  return {
    buildData,
    joinedData,
    computedData,
    parsedModel,
    computedModel,
    reset: () => {
      computedModel.reset()
      buildData.reset()
      joinedData.reset()
      computedData.reset()
      parsedModel.reset()
    },
  }
}

class ProjectModelCache2 extends SimpleCache<ProjectId, ReturnType<typeof createProjectModelCache2>> {
  constructor(services: LikeC4Services) {
    super()
    this.onDispose(
      services.shared.workspace.DocumentBuilder.onDocumentPhase(DocumentState.Linked, async (doc) => {
        if (isLikeC4UserDocument(doc) && doc.likec4ProjectId) {
          this.of(doc.likec4ProjectId).buildData.reset()
        }
      }),
    )
    this.onDispose(
      services.shared.workspace.ManualLayouts.onManualLayoutUpdate(({ projectId }) => {
        this.of(projectId).computedData.reset()
        // strst
      }),
    )
    this.onDispose(
      services.shared.workspace.DocumentBuilder.onUpdate((_changed, deleted) => {
        if (deleted.length > 0) { // react only on deleted documents
          const pm = services.shared.workspace.ProjectsManager
          const projects = unique(map(deleted, pm.ownerProjectId.bind(pm)))
          if (!hasAtLeast(projects, 1)) {
            return
          }
          builderLogger.trace`clear project caches for: ${projects} (on delete ${deleted.map(d => d.fsPath)})`
          for (const project of projects) {
            this.of(project).reset()
          }
        }
      }),
    )
    // services.shared.workspace.DocumentBuilder.onUpdate((_changed, deleted) => {
    //   // react only on deleted documents
    //   if (deleted.length <= 0) {
    //     return
    //   }
    //   //  // react only on deleted documents
    //   // if (deleted.length <= 0) {
    //   //   return
    //   // }
    //   // const pm = services.shared.workspace.ProjectsManager
    //   // const projects = unique(map(deleted, pm.ownerProjectId.bind(pm)))
    //   // if (!hasAtLeast(projects, 1)) {
    //   //   return
    //   // }
    //   // builderLogger.trace`clear project caches for: ${projects} (on delete ${deleted.map(d => d.fsPath)})`
    //   // for (const project of projects) {
    //   //   this.clear(project)
    //   // }
    // }),
  }

  public of(project: ProjectId) {
    return this.get(project, () => createProjectModelCache2(project))
  }

  buildData<R extends { hash: string }>(
    project: ProjectId,
    gethash: () => R | null,
    create: (arg: R) => BuildModelData | null,
  ): Hashed<BuildModelData | null> | null {
    return this.of(project).buildData.find(gethash, create)
  }

  joinedData<R extends { hash: string }>(
    project: ProjectId,
    hash: () => R | null,
    create: (arg: R) => c4.ParsedLikeC4ModelData,
  ): Hashed<c4.ParsedLikeC4ModelData> | null {
    return this.of(project).joinedData.find(hash, create)
  }

  parsedModel<R extends { hash: string }>(
    project: ProjectId,
    hash: () => R | null,
    create: (arg: R) => LikeC4Model.Parsed,
  ): Hashed<LikeC4Model.Parsed> | null {
    return this.of(project).parsedModel.find(hash, create)
  }

  computedData<R extends { hash: string }>(
    project: ProjectId,
    hash: () => R | null,
    create: (arg: R) => c4.ComputedLikeC4ModelData,
  ): Hashed<c4.ComputedLikeC4ModelData> | null {
    return this.of(project).computedData.find(hash, create)
  }

  computedModel<R extends { hash: string }>(
    project: ProjectId,
    hash: () => R | null,
    create: (arg: R) => LikeC4Model.Computed,
  ): Hashed<LikeC4Model.Computed> | null {
    return this.of(project).computedModel.find(hash, create)
  }
}
