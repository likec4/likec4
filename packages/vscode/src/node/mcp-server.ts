import {
  fromWorkspace,
} from '@likec4/language-services/node'
import {
  configureLogger,
  getConsoleStderrSink,
  rootLogger,
} from '@likec4/log'
import { URI } from 'langium'
import { first, hasAtLeast, isString, map } from 'remeda'
import z from 'zod/v4'

const logger = rootLogger.getChild('mcp')
process.on('uncaughtException', (err) => {
  logger.error('uncaughtException', { err })
})
process.on('unhandledRejection', (err) => {
  logger.error('unhandledRejection', { err })
})

configureLogger({
  sinks: {
    console: getConsoleStderrSink(),
  },
})

const envSchema = z.string().or(z.array(z.string()))

/**
 * Read LIKEC4_WORKSPACE env: JSON array of paths or single path string.
 * Falls back to treating raw value as one workspace path if not valid JSON.
 * @param name - Environment variable name (e.g. 'LIKEC4_WORKSPACE').
 * @returns Array of absolute fs paths, or undefined if unset/invalid.
 */
function readEnvVar(name: string): [string, ...string[]] | undefined {
  const value = process.env[name]
  if (!value) return undefined
  logger.debug`Environment variable ${name}: ${value}`
  try {
    const parsed = envSchema.parse(JSON.parse(value))
    const asArray = isString(parsed) ? [parsed] : parsed
    if (hasAtLeast(asArray, 1)) {
      return map(asArray, v => URI.parse(v).fsPath)
    }
  } catch {
    // Fallback: treat raw value as a single workspace path (e.g. plain path not JSON).
    const trimmed = value.trim()
    if (trimmed.length > 0) {
      return [URI.file(trimmed).fsPath]
    }
  }
  return undefined
}

const workspacePaths = readEnvVar('LIKEC4_WORKSPACE')
logger.debug`Workspace paths: ${workspacePaths}`
logger.debug`cwd: ${process.cwd()}`

const workspacePath = workspacePaths ? first(workspacePaths) : process.cwd()

fromWorkspace(workspacePath, {
  manualLayouts: true,
  watch: true,
  mcp: 'stdio',
}).then(
  likec4 => {
    likec4.languageServices.mcpServer?.mcp.sendLoggingMessage({
      level: 'info',
      data: ['LikeC4 MCP server ready'],
    }).catch(err => {
      logger.error('Failed to send logging message to MCP client', { err })
    })
  },
  err => {
    logger.error('Failed to start MCP server', { err })
    process.exit(1)
  },
)
