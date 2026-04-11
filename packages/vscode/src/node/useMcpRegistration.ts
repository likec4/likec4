import { nonNullable } from '@likec4/core'
import { join } from 'pathe'
import {
  computed,
  createSingletonComposable,
  extensionContext,
  useDisposable,
  useEventEmitter,
  useWorkspaceFolders,
} from 'reactive-vscode'
import vscode from 'vscode'
import { version } from '../meta'
import { useExtensionLogger } from '../useExtensionLogger.ts'
import { useWorkspaceId } from '../useWorkspaceId.ts'

function isMcpStdioServerDefinition(server: vscode.McpServerDefinition): server is vscode.McpStdioServerDefinition {
  return 'args' in server && 'command' in server
}

export const useMcpRegistration = createSingletonComposable(() => {
  const { logger } = useExtensionLogger()
  const onDidChange = useEventEmitter<void>()

  const folders = useWorkspaceFolders()
  const workspaceFolders = computed(() => folders.value?.map(f => f.uri.toString()) ?? [])
  const workspaceId = useWorkspaceId()
  const ctx = nonNullable(extensionContext.value, 'Extension context not available during MCP registration')

  const serverModule = ctx.asAbsolutePath(
    join(
      'dist',
      'node',
      'mcp-server.mjs',
    ),
  )

  useDisposable(
    vscode.lm.registerMcpServerDefinitionProvider('likec4', {
      onDidChangeMcpServerDefinitions: onDidChange.event,
      provideMcpServerDefinitions: () => {
        logger.debug(`provide MCP server definition`)
        return [
          new vscode.McpStdioServerDefinition(
            'likec4',
            'node',
            [
              serverModule,
              // 'mcp',
              // '--stdio',
              // ...config.graphviz.mode === 'binary' ? ['--use-dot'] : [],
              // '--log-level',
              // isDev ? 'debug' : 'info',
            ],
            {
              NODE_ENV: 'production',
            },
            version,
          ),
        ]
      },
      resolveMcpServerDefinition: async (server) => {
        logger.debug(`Resolving MCP server ${server.label}`)
        if (server.label === 'likec4' && isMcpStdioServerDefinition(server)) {
          logger.debug`Resolved MCP server ${{
            args: server.args,
            workspaceFolders: workspaceFolders.value,
            workspaceId,
          }}`

          Object.assign(server.env, {
            LIKEC4_WORKSPACE_ID: workspaceId,
            LIKEC4_WORKSPACE: JSON.stringify(workspaceFolders.value),
          })
        }
        return server
      },
    }),
  )
})
