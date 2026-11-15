import { rootLogger } from '@likec4/log'
import defu from 'defu'
import { URI } from 'langium'
import { writeFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import k from 'tinyrainbow'
import { withTrailingSlash } from 'ufo'
import { createFromSources } from '../common/createFromSources'
import { handleInitOptions } from '../common/handleInitOptions'
import { type LikeC4Diagnostic, type LikeC4Langium, type LikeC4LanguageServices, LikeC4 } from '../common/LikeC4'
import {
  type FromWorkspaceOptions as CommonFromWorkspaceOptions,
  type InitOptions,
  DefaultInitOptions,
} from '../common/options'
import { configureLogger } from './configureLogger'
import { type CreateLanguageServiceOptions, createLanguageServices } from './createLanguageServices'
import {
  type DependencyInstallReport,
  type InstallDependenciesOptions,
  DependenciesNotInstalledError,
  installDependencies,
  notInstalledDependencies,
} from './dependencies'

export type {
  DependencyInstallReport,
  InitOptions,
  InstallDependenciesOptions,
  LikeC4Diagnostic,
  LikeC4Langium,
  LikeC4LanguageServices,
}

export { LikeC4 } from '../common/LikeC4'

export { DependenciesNotInstalledError, formatGitDependencySource, type NotInstalledDependency } from './dependencies'

/**
 * Options of {@link fromWorkspace} (Node)
 */
export type FromWorkspaceOptions = CommonFromWorkspaceOptions & {
  /**
   * If true, rejects with {@link DependenciesNotInstalledError} when git dependencies of the workspace
   * are not installed (see `likec4 install`). Used by CLI commands that need the complete model.
   *
   * Otherwise a dependency that is not installed is reported as a model error
   * on the import (see {@link LikeC4.getErrors}), and the instance is created
   * (unless {@link InitOptions.throwIfInvalid} is set).
   *
   * @default false
   */
  requireInstalledDependencies?: boolean | undefined
}

/**
 * Creates language services and loads the workspace.
 * Installed git dependencies are read from the cache, nothing is downloaded.
 */
async function loadWorkspace(path: string, options: FromWorkspaceOptions | undefined): Promise<LikeC4Langium> {
  const workspacePath = resolve(path)
  // Normalize folder URI with trailing slash so LSP/workspace consumers resolve paths consistently (CI vs local)
  const folderUri = URI.file(workspacePath).toString()
  const workspaceUri = withTrailingSlash(folderUri)

  const logger = rootLogger.getChild('lang')

  const opts = defu(
    options,
    {
      ...DefaultInitOptions,
      useFileSystem: true,
      manualLayouts: true,
      watch: false,
    } satisfies CreateLanguageServiceOptions,
  )
  configureLogger(opts)

  const langium = createLanguageServices(opts)

  const workspace = {
    name: basename(workspacePath),
    uri: workspaceUri,
  }

  const WorkspaceManager = langium.shared.workspace.WorkspaceManager
  logger.info(`${k.dim('workspace:')} ${workspacePath}`)
  WorkspaceManager.initialize({
    capabilities: {},
    processId: null,
    rootUri: workspace.uri,
    workspaceFolders: [workspace],
  })
  await WorkspaceManager.initialized({})
  return langium
}

/**
 * Create a LikeC4 instance from a workspace directory
 *
 * Git dependencies are read from the cache and never downloaded (see {@link installWorkspaceDependencies}).
 * A dependency that is not installed is a model error (see {@link LikeC4.getErrors}),
 * or rejects with {@link DependenciesNotInstalledError} if {@link FromWorkspaceOptions.requireInstalledDependencies} is set.
 *
 * @param path - The workspace directory path
 * @param options - Optional configuration options
 * @returns A Promise that resolves to a LikeC4 instance
 */
export async function fromWorkspace(path: string, options?: FromWorkspaceOptions): Promise<LikeC4> {
  const logger = rootLogger.getChild('lang')
  const langium = await loadWorkspace(path, options)

  if (options?.requireInstalledDependencies) {
    const notInstalled = notInstalledDependencies(langium)
    if (notInstalled.length > 0) {
      await langium.likec4.likec4.LanguageServices.dispose()
      throw new DependenciesNotInstalledError(notInstalled)
    }
  }

  const userDocuments = langium.shared.workspace.LangiumDocuments.userDocuments.toArray()

  if (userDocuments.length === 0) {
    logger.error(`no LikeC4 sources found`)
    if (options?.throwIfInvalid) {
      await langium.likec4.likec4.LanguageServices.dispose()
      throw new Error(`no LikeC4 sources found`)
    }
  }

  logger.info(`${k.dim('workspace:')} found ${userDocuments.length} source files`)

  return handleInitOptions(langium, rootLogger, options)
}

/**
 * Options of {@link installDependencies}
 */
export type InstallWorkspaceDependenciesOptions =
  & InstallDependenciesOptions
  & Pick<InitOptions, 'configureLogger' | 'logLevel'>

/**
 * Installs git dependencies of the workspace into the cache (`likec4 install`, or `likec4 update` with `update`):
 * resolves refs that are not in the version index yet (all refs with `update`) and downloads the sources.
 * Requires git. Never throws for failed installs: they are returned with the status `failed`.
 *
 * The cache directory is `$LIKEC4_CACHE_DIR/dependencies`, or `dependencies` in the user cache directory.
 *
 * @param path - The workspace directory path
 * @throws if the project or the dependency name is unknown
 */
export async function installWorkspaceDependencies(
  path: string,
  options?: InstallWorkspaceDependenciesOptions,
): Promise<DependencyInstallReport[]> {
  const langium = await loadWorkspace(path, {
    configureLogger: options?.configureLogger ?? false,
    logLevel: options?.logLevel,
    // the model is not needed
    manualLayouts: false,
  })
  try {
    return await installDependencies(langium, options)
  } finally {
    await langium.likec4.likec4.LanguageServices.dispose()
  }
}

/**
 * Create a LikeC4 instance from the current working directory
 * @param options - Optional configuration options
 * @returns A Promise that resolves to a LikeC4 instance
 */
export async function fromWorkdir(options?: FromWorkspaceOptions): Promise<LikeC4> {
  return await fromWorkspace('.', options)
}

/**
 * Create a LikeC4 instance from a record of source files
 *
 * @example
 * ```ts
 * const likec4 = await fromSources({
 *   'likec4.config.json': '...', // optional, stringified LikeC4Config
 *   'model.c4': 'model { ... }',
 *   'path/views.c4': 'views { ... }',
 * })
 * ```
 *
 * @param sources - A record of file paths to source content
 * @param options - Optional configuration options
 * @returns A Promise that resolves to a LikeC4 instance
 */
export async function fromSources(sources: Record<string, string>, options?: InitOptions): Promise<LikeC4> {
  configureLogger(options)
  const logger = rootLogger.getChild('lang')

  const langium = createLanguageServices(
    defu(
      options,
      {
        ...DefaultInitOptions,
        useFileSystem: false,
        watch: false,
        manualLayouts: false,
      } satisfies CreateLanguageServiceOptions,
    ),
  )

  return await createFromSources(langium, logger, sources, options)
}

/**
 * Create a LikeC4 instance from a single source string
 * @param source - The LikeC4 source code
 * @param options - Optional configuration options
 * @returns A Promise that resolves to a LikeC4 instance
 */
export function fromSource(source: string, options?: InitOptions): Promise<LikeC4> {
  return fromSources({ 'source.c4': source }, options)
}

/**
 * Options for {@link writeDSL}.
 */
export interface WriteDSLOptions {
  /** Project to render (when the workspace has multiple). Defaults to the only one. */
  project?: string
  /** Output filename. Default: `model.c4`. */
  fileName?: string
}

/**
 * Renders the parsed model back to LikeC4 DSL source and writes it to disk.
 *
 * The output is a single, formatted `.c4` file. This round-trip is intentionally
 * LOSSY: comments, source positions and original formatting are not preserved.
 *
 * @param likec4 - A LikeC4 instance (typically from `fromWorkspace`).
 * @param targetDir - Directory to write the output file into. Must already exist.
 * @param options - {@link WriteDSLOptions}
 * @returns The full path of the written file.
 *
 * @example
 * ```ts
 * const likec4 = await LikeC4.fromWorkspace('/path/to/workspace')
 * const out = await writeDSL(likec4, '/tmp/generated')
 * console.log(`Wrote DSL to ${out}`)
 * ```
 */
export async function writeDSL(
  likec4: LikeC4,
  targetDir: string,
  options?: WriteDSLOptions,
): Promise<string> {
  const dsl = await likec4.toDSL(options?.project)
  // Don't path.resolve() the targetDir — on Windows that prepends the current
  // drive letter to POSIX-style paths (e.g. `/tmp/x` → `D:\tmp\x`), which both
  // surprises callers and breaks platform-portable tests. writeFile resolves
  // relative paths against cwd anyway.
  const fullPath = join(targetDir, options?.fileName ?? 'model.c4')
  await writeFile(fullPath, dsl, 'utf-8')
  return fullPath
}
