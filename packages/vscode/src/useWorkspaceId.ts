import { nanoid } from 'nanoid'
import { createSingletonComposable } from 'reactive-vscode'

/**
 * Get or create a unique workspace ID. This is used to correlate the MCP server with the workspace.
 * Currently generated once per extension session (not persisted in workspace state).
 */
export const useWorkspaceId = createSingletonComposable(() => {
  return `likec4-${nanoid(4)}`
})
