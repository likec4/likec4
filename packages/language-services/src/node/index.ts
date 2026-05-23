import { rootLogger } from '@likec4/log'
import defu from 'defu'
import { URI } from 'langium'
import { writeFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import k from 'tinyrainbow'
import { withTrailingSlash } from 'ufo'
import { createFromSources } from '../common/createFromSources'
import { handleInitOptions } from '../common/handleInitOptions'
import { type LikeC4Langium, type LikeC4LanguageServices, LikeC4 } from '../common/LikeC4'
import { type FromWorkspaceOptions, type InitOptions, DefaultInitOptions } from '../common/options'
import { configureLogger } from './configureLogger'
import { type CreateLanguageServiceOptions, createLanguageServices } from './createLanguageServices'

export type {
  FromWorkspaceOptions,
  InitOptions,
  LikeC4Langium,
  LikeC4LanguageServices,
}

export { LikeC4 } from '../common/LikeC4'

/**
 * Create a LikeC4 instance from a workspace directory
 *
 * @param path - The workspace directory path
 * @param options - Optional configuration options
 * @returns A Promise that resolves to a LikeC4 instance
 */
export async function fromWorkspace(path: string, options?: FromWorkspaceOptions): Promise<LikeC4> {
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

  const userDocuments = langium.shared.workspace.LangiumDocuments.userDocuments.toArray()

  if (userDocuments.length === 0) {
    logger.error(`no LikeC4 sources found`)
    if (options?.throwIfInvalid) {
      throw new Error(`no LikeC4 sources found`)
    }
  }

  logger.info(`${k.dim('workspace:')} found ${userDocuments.length} source files`)

  return handleInitOptions(langium, rootLogger, options)
}

/**
 * Create a LikeC4 instance from the current working directory
 * @param options - Optional configuration options
 * @returns A Promise that resolves to a LikeC4 instance
 */
export async function fromWorkdir(options?: FromWorkspaceOptions): Promise<LikeC4> {
  return fromWorkspace('.', options)
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
export async function fromSource(source: string, options?: InitOptions): Promise<LikeC4> {
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
