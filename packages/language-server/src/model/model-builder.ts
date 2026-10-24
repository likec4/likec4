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
import { computeView, withoutDiffOnlyReferences } from '@likec4/core/compute-view'
import { LikeC4Model } from '@likec4/core/model'
import * as c4 from '@likec4/core/types'
import { LRUMap, objectHash, stringHash } from '@likec4/core/utils'
import { type Logger, loggable } from '@likec4/log'
import {
  type Cancellation,
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
import { type ParsedLikeC4LangiumDocument, isLikeC4LangiumDocument, isLikeC4UserDocument } from '../ast'
import type {
  DescriptionFileReference,
  LikeC4DescriptionFiles,
  LikeC4ManualLayouts,
  ManualLayoutsSnapshot,
} from '../filesystem'
import { isNotLikeC4Builtin } from '../likec4lib'
import { logger as mainLogger } from '../logger'
import type { LikeC4Services } from '../module'
import { ADisposable, performanceMark } from '../utils'
import { assignNavigateTo } from '../view-utils'
import { type LikeC4DocumentBuilder, type ProjectData, ProjectsManager } from '../workspace'
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
  private readonly cache: ProjectModelCache
  private readonly DocumentBuilder: LikeC4DocumentBuilder
  private readonly manualLayouts: LikeC4ManualLayouts
  private readonly descriptionFiles: LikeC4DescriptionFiles
  private readonly mutex: WorkspaceLock
  private readonly lastSeen: LastSeenArtifacts

  constructor(protected services: LikeC4Services) {
    super()
    this.projects = services.shared.workspace.ProjectsManager
    this.parser = services.likec4.ModelParser
    this.DocumentBuilder = services.shared.workspace.DocumentBuilder
    this.mutex = services.shared.workspace.WorkspaceLock
    this.manualLayouts = services.shared.workspace.ManualLayouts
    this.descriptionFiles = services.shared.workspace.DescriptionFiles
    this.lastSeen = services.likec4.LastSeen

    this.onDispose(
      this.cache = new ProjectModelCache(services),
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
      // A referenced description file changed: the parsed model carries its content, so the caches
      // have to go with it. Not only the ones of the project that owns the file: a project that
      // imports from it holds a cached copy of the imported elements (see
      // `unsafeSyncJoinedModelData`) and would keep serving the old description. A precise walk of
      // the project graph is possible, but a description file changing is rare enough that clearing
      // the model cache is the cheaper honest answer.
      this.descriptionFiles.onDescriptionFileUpdate(() => {
        this.cache.clear()
        this.notifyListeners(
          Array.from(this.services.shared.workspace.LangiumDocuments.all, doc => doc.uri),
        )
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
   * STEP 1: Read model data from parsed documents
   *
   * WARNING:
   * This method is internal and should to be called only when all documents are known to be parsed.
   * Otherwise, the model may be incomplete.
   *
   * To avoid circular dependencies, we do not resolve imports here.
   */
  private buildModelData(projectId: c4.ProjectId | ProjectDocumentsCache): Hashed<BuildModelData | null> | null {
    // const logger ?= builderLogger.getChild(projectId)
    const projectCache = typeof projectId === 'string' ? this.projectDocumentsCache(projectId) : projectId
    if (projectCache.hash === null) {
      return null
    }
    return this.cache.buildModelData(
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
   * STEP 2: Parse model data and resolve imports
   *
   * To avoid circular dependencies, first we parse all documents and then we join them.
   */
  private parseAndResolveImports(projectId: c4.ProjectId): Hashed<c4.ParsedLikeC4ModelData> | null {
    const logger = builderLogger.getChild(projectId)

    return this.cache.parsedWithImports<Hashed<BuildModelData>>(
      projectId,
      () => {
        const { hash, value } = this.buildModelData(projectId) ?? {}
        if (!hash || !value) {
          this.cache.setImports(projectId, [])
          return null
        }
        const importedProjects = [...value.imports.associations()]
          .filter(([, fqns]) => fqns.size > 0)
          .map(([importedProjectId]) => importedProjectId)
        // Track dependencies, so that changes in imported projects invalidate this project
        this.cache.setImports(projectId, importedProjects)
        if (importedProjects.length === 0) {
          return { hash, value }
        }
        // Joined data depends on imported projects, include their hashes
        const joinedHash = importedProjects.reduce(
          (acc, importedProjectId) =>
            stringHash(acc + importedProjectId + (this.buildModelData(importedProjectId)?.hash ?? '')),
          hash,
        )
        return { hash: joinedHash, value }
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
          const anotherProject = this.buildModelData(projectId)?.value?.data
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
   * STEP 3: Create LikeC4Model.Parsed from parsed data
   *
   * We need it for further computing
   */
  private unsafeSyncParsedModel(projectId: c4.ProjectId): Hashed<LikeC4Model.Parsed> | null {
    return this.cache.parsedModel(
      projectId,
      () => this.parseAndResolveImports(projectId),
      ({ value }) => LikeC4Model.create(value),
    )
  }

  /**
   * STEP 4: Compute ComputedLikeC4ModelData from parsed model
   *
   * At this step we need to know if there are manual layouts.
   */
  private unsafeSyncComputeData(
    projectId: c4.ProjectId,
    manualLayouts: ManualLayoutsSnapshot | null = null,
  ): Hashed<c4.ComputedLikeC4ModelData> | null {
    const logger = builderLogger.getChild(projectId)
    return this.cache.computedData(
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
          // Views scoped to an element added by a diff do not exist before the diff
          const sanitized = withoutDiffOnlyReferences(view, parsedModel.$data)
          if (!sanitized) {
            continue
          }
          const result = computeView(sanitized, parsedModel)
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

  /**
   * STEP 5: Compute LikeC4Model<UnknownComputed> from computed data
   *
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
    // Reset latest computed data/model if manual layouts changed
    if (this.DocumentBuilder.currentPhase < DocumentState.Linked) {
      builderLogger.warn('Method called before linking, it is WRONG')
    }
    this.cache.of(projectId).useManualLayouts(manualLayouts)
    const computedModel = this.cache.computedModel(
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

  /**
   * Returns parsed model of the project.
   * Waits until DocumentBuilder reaches {@link DocumentState.Linked} state.
   *
   * WARNING:
   * Do not await this method inside `DocumentBuilder.onBuildPhase` listeners
   * for {@link DocumentState.Linked} or earlier states.
   * Builder reaches the state only after all listeners are completed, this leads to a deadlock.
   */
  public async parseModel(
    projectId?: c4.ProjectId | undefined,
    cancelToken?: CancellationToken,
  ): Promise<LikeC4Model<UnknownParsed>> {
    cancelToken ??= CancellationToken.None
    await this.DocumentBuilder.waitUntil(DocumentState.Linked, cancelToken)
    projectId = this.projects.ensureProjectId(projectId)
    const logger = builderLogger.getChild(projectId)
    await interruptAndCheck(cancelToken)
    await this.readDescriptionFiles()
    const parsedModel = this.unsafeSyncParsedModel(projectId)
    if (!parsedModel) {
      logger.debug`parseModel: returning EMPTY`
      return LikeC4Model.EMPTY.asParsed
    }
    return parsedModel.value
  }

  public async computeModel(
    projectId?: c4.ProjectId | undefined,
    cancelToken?: CancellationToken,
  ): Promise<LikeC4Model<UnknownComputed>> {
    projectId = this.projects.ensureProjectId(projectId)
    const logger = builderLogger.getChild(projectId)
    const token = cancelToken ?? CancellationToken.None
    logger.debug`computeModel: waiting for linked`
    await this.DocumentBuilder.waitUntil(DocumentState.Linked, token)
    logger.debug`computeModel: linked`
    return await this.mutex.read(async () => {
      await interruptAndCheck(token)
      const project = this.projects.getProject(projectId)
      await this.readDescriptionFiles()
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

  /**
   * Reads the files referenced by `descriptionFile` in every parsed document, and parses the
   * documents whose content arrived again.
   *
   * A parsed entity holds the reference to its file until the model is built, and the read belongs
   * here - not to the document build phases - so a workspace that is only parsed reads nothing. The
   * parser is synchronous, so the documents that were parsed before their files were read have to be
   * parsed again for the descriptions to be resolved (they are parsed again anyway when their content
   * is in the parser hash).
   */
  private async readDescriptionFiles(): Promise<void> {
    const refs: DescriptionFileReference[] = []
    for (const doc of this.services.shared.workspace.LangiumDocuments.all) {
      if (!isLikeC4LangiumDocument(doc)) {
        continue
      }
      for (const ref of doc.c4DescriptionFiles ?? []) {
        refs.push({ docUri: doc.uri, ...ref })
      }
    }
    if (refs.length === 0) {
      return
    }
    const reread = await this.descriptionFiles.read(refs)
    if (reread.length > 0) {
      this.parser.reparse(reread)
    }
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

/**
 * Creates a cache with LRU eviction and optional reset callback.
 * - `find(key, create)` returns cached value if hash matches, otherwise creates and caches new value
 * - `reset()` clears the cache and calls the optional `onReset` callback
 */
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

function createProjectCache(project: ProjectId, onBuildDataReset?: () => void) {
  const logger = builderLogger.getChild(project)
  const buildData = getOrCreate<BuildModelData | null>({
    logger: logger.getChild('buildData'),
    onReset: () => {
      joinedData.reset()
      onBuildDataReset?.()
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
  // Hash of manual layouts used for the latest computed data
  let manualLayoutsHash: string | null = null
  return {
    buildData,
    joinedData,
    computedData,
    parsedModel,
    computedModel,
    /**
     * Resets computed data (and model) if manual layouts differ from the ones used for the latest computed data
     */
    useManualLayouts: (manualLayouts: ManualLayoutsSnapshot | null) => {
      const hash = manualLayouts?.hash ?? null
      if (hash !== manualLayoutsHash) {
        manualLayoutsHash = hash
        computedData.reset()
      }
    },
    reset: () => {
      computedModel.reset()
      buildData.reset()
      joinedData.reset()
      computedData.reset()
      parsedModel.reset()
    },
  }
}

class ProjectModelCache extends SimpleCache<ProjectId, ReturnType<typeof createProjectCache>> {
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
      }),
    )

    this.onDispose(
      // Model could be built between Linked and Validated phases, from parser without validation results
      services.likec4.ModelParser.onReparsedAfterValidation(doc => {
        if (isLikeC4UserDocument(doc) && doc.likec4ProjectId) {
          this.of(doc.likec4ProjectId).buildData.reset()
        }
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
            // Resets importers as well (via buildData reset)
            this.of(project).reset()
            // Imports are recorded again on next joinedData computation
            this.setImports(project, [])
          }
        }
      }),
    )
  }

  /**
   * Reverse dependency graph: project -> projects that import from it
   */
  private readonly importedBy = new Map<ProjectId, Set<ProjectId>>()

  public of(project: ProjectId) {
    return this.get(project, () => createProjectCache(project, () => this.resetImportedBy(project)))
  }

  /**
   * Records projects the given project imports from (replaces previously recorded)
   */
  setImports(project: ProjectId, importedProjects: Iterable<ProjectId>): void {
    for (const importers of this.importedBy.values()) {
      importers.delete(project)
    }
    for (const imported of importedProjects) {
      if (imported === project) {
        continue
      }
      let importers = this.importedBy.get(imported)
      if (!importers) {
        importers = new Set()
        this.importedBy.set(imported, importers)
      }
      importers.add(project)
    }
  }

  /**
   * Resets joined data of projects that (transitively) import from the given project
   */
  private resetImportedBy(project: ProjectId): void {
    const visited = new Set<ProjectId>([project])
    const queue = [project]
    let next: ProjectId | undefined
    while ((next = queue.pop())) {
      for (const importer of this.importedBy.get(next) ?? []) {
        if (visited.has(importer)) {
          continue
        }
        visited.add(importer)
        queue.push(importer)
        this.of(importer).joinedData.reset()
      }
    }
  }

  override clear(): void {
    this.importedBy.clear()
    super.clear()
  }

  buildModelData<R extends { hash: string }>(
    project: ProjectId,
    gethash: () => R | null,
    create: (arg: R) => BuildModelData | null,
  ): Hashed<BuildModelData | null> | null {
    return this.of(project).buildData.find(gethash, create)
  }

  parsedWithImports<R extends { hash: string }>(
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
