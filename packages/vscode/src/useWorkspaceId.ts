import { nanoid } from 'nanoid'
import { defineService, readonly, toRef } from 'reactive-vscode'

/**
 * Get or create a unique workspace ID. This is used to correlate the MCP server with the workspace.
 * Currently generated once per extension session (not persisted in workspace state).
 */
export const useWorkspaceId = defineService(() => {
  const id = `likec4-${nanoid(4)}`
  return readonly(toRef(id))
})
