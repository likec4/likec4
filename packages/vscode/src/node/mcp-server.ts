import { nonNullable } from '@likec4/core'
import { configureLanguageServerLogger } from '@likec4/language-server'
import {
  fromWorkspace,
} from '@likec4/language-services/node'
import { rootLogger } from '@likec4/log'
import { URI } from 'langium'
import { first, hasAtLeast, isString, map } from 'remeda'
import { isDevelopment } from 'std-env'
import z from 'zod/v4'

configureLanguageServerLogger({
  useStdErr: true,
  colors: false,
  logLevel: isDevelopment ? 'trace' : 'debug',
})

const logger = rootLogger.getChild('mcp')
process.on('uncaughtException', (err) => {
  logger.error('uncaughtException', { err })
})
process.on('unhandledRejection', (err) => {
  logger.error('unhandledRejection', { err })
})

const envSchema = z.string().or(z.array(z.string()))

/**
 * Read LIKEC4_WORKSPACE env: JSON array of file URIs (e.g., "file:///path") or single path string.
 * Falls back to treating raw value as one workspace path if not valid JSON.
 * @param name - Environment variable name (e.g. 'LIKEC4_WORKSPACE').
 * @returns Non-empty array of absolute fs paths, or undefined if unset/empty.
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
logger.info`Workspace paths: ${workspacePaths}`
logger.info`cwd: ${process.cwd()}`

const workspacePath = workspacePaths ? first(workspacePaths) : process.cwd()

async function bootstrap() {
  const likec4 = await fromWorkspace(workspacePath, {
    manualLayouts: true,
    watch: true,
    configureLogger: false,
    mcp: 'stdio',
  })

  const mcp = nonNullable(likec4.languageServices.mcpServer?.mcp, 'MCP server not initialized')

  await mcp.sendLoggingMessage({
    level: 'info',
    data: 'LikeC4 MCP server ready',
  })

  for (const project of likec4.languageServices.projects()) {
    await mcp.sendLoggingMessage({
      level: 'info',
      data: `Project ${project.id} in ${project.folder.path} with ${project.documents.length} sources`,
    })
  }
}

bootstrap().catch(err => {
  logger.error('Failed to start MCP server', { err })
  process.exit(1)
})
