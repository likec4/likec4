import isInsideContainer from 'is-inside-container'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { unique } from 'remeda'
import { findAppConfig, loadAppConfig, parseAppConfig } from './load'
import type { ParsedLikeC4AppConfig } from './schema'

/**
 * Flags of the CLI that have a counterpart in the app config.
 * A flag is `undefined` when it is not given; paths are absolute.
 */
export interface AppConfigFlags {
  /**
   * `--app-config <file>` or `false` for `--no-app-config`
   */
  appConfig?: string | boolean | undefined
  /**
   * Directory with LikeC4 sources
   */
  path?: string | undefined
  useDot?: boolean | undefined
  base?: string | undefined
  title?: string | undefined
  theme?: 'light' | 'dark' | undefined
  useHashHistory?: boolean | undefined
  webcomponentPrefix?: string | undefined
  customization?: string | undefined
  publicDir?: string | undefined
  output?: string | undefined
  outputSingleFile?: boolean | undefined
  buildWebcomponent?: boolean | undefined
  listen?: string | undefined
  port?: number | undefined
  hmrPort?: number | undefined
  allowedHosts?: string[] | undefined
}

/**
 * The app config after merging: flags of the CLI, environment variables, the config file, defaults.
 */
export interface ResolvedAppConfig extends Omit<ParsedLikeC4AppConfig, 'workspace' | 'graphviz'> {
  /**
   * The loaded config file, if any
   */
  configFile: string | undefined
  workspace: string
  graphviz: 'wasm' | 'binary'
}

type Env = Record<string, string | undefined>

function parsePort(value: string | undefined): number | undefined {
  if (!value) {
    return undefined
  }
  const port = Number.parseInt(value, 10)
  return Number.isNaN(port) ? undefined : port
}

/**
 * Finds the config file: `--app-config`, then the workspace (if given explicitly), then the current directory
 */
function locateAppConfig(flags: AppConfigFlags, workspace: string | undefined, cwd: string): string | undefined {
  if (flags.appConfig === false) {
    return undefined
  }
  if (typeof flags.appConfig === 'string') {
    const file = resolve(cwd, flags.appConfig)
    if (!existsSync(file)) {
      throw new Error(`LikeC4 app config not found: ${file}`)
    }
    return file
  }
  return findAppConfig(unique([...(workspace ? [workspace] : []), cwd]))
}

/**
 * Resolves the app config for the CLI command.
 * Precedence: flag of the CLI, environment variable, the config file, default.
 */
export async function resolveAppConfig(
  flags: AppConfigFlags,
  { cwd = process.cwd(), env = process.env }: { cwd?: string; env?: Env } = {},
): Promise<ResolvedAppConfig> {
  const explicitWorkspace = flags.path ??
    (env['LIKEC4_WORKSPACE'] ? resolve(cwd, env['LIKEC4_WORKSPACE']) : undefined)

  const configFile = locateAppConfig(flags, explicitWorkspace, cwd)
  const file = configFile ? await loadAppConfig(configFile) : parseAppConfig({})

  const useDot = flags.useDot ?? (file.graphviz ? file.graphviz === 'binary' : isInsideContainer())

  return {
    configFile,
    workspace: explicitWorkspace ?? file.workspace ?? cwd,
    graphviz: useDot ? 'binary' : 'wasm',
    title: flags.title ?? file.title,
    theme: flags.theme ?? file.theme,
    useHashHistory: flags.useHashHistory ?? file.useHashHistory,
    webcomponentPrefix: flags.webcomponentPrefix ?? file.webcomponentPrefix,
    customization: flags.customization ?? file.customization,
    base: flags.base ?? file.base,
    publicDir: flags.publicDir ?? file.publicDir,
    build: {
      outDir: flags.output ?? file.build.outDir,
      singleFile: flags.outputSingleFile ?? file.build.singleFile,
      webcomponent: flags.buildWebcomponent ?? file.build.webcomponent,
    },
    server: {
      host: flags.listen ?? file.server.host,
      port: flags.port ?? parsePort(env['PORT']) ?? file.server.port,
      hmrPort: flags.hmrPort ?? parsePort(env['HMR_PORT']) ?? file.server.hmrPort,
      allowedHosts: flags.allowedHosts ?? file.server.allowedHosts,
    },
  }
}
