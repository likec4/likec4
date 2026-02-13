import { nanoid } from 'nanoid'
import {
  createSingletonComposable,
  extensionContext,
} from 'reactive-vscode'

/**
 * Get or create a unique workspace ID. This is used to correlate the MCP server with the workspace.
 * Currently generated once per extension session (not persisted in workspace state).
 */
export const useWorkspaceId = createSingletonComposable(() => {
  // const workspaceState = extensionContext.value?.workspaceState
  // if (!workspaceState) {
  //   return `likec4-${nanoid(4)}`
  // }
  // let workspaceId = workspaceState.get<string>('workspaceId')
  // if (!workspaceId) {
  //   workspaceId = `likec4-${nanoid(4)}`
  //   workspaceState.update('workspaceId', workspaceId)
  // }
  return `likec4-${nanoid(4)}`
})
