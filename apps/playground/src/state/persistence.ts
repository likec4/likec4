export function readWorkspace(key: string): any {
  const value = localStorage.getItem(key)
  return value ? JSON.parse(value) : null
}

// TEMP: This is a temporary function to write workspace to localStorage
export const WorkspacePersistence = {
  read(workspaceId: string) {
    const key = `likec4:workspace:${workspaceId}`
    try {
      let fromStorage = localStorage.getItem(key)
      if (fromStorage) {
        const parsed = JSON.parse(fromStorage) as {
          activeFilename?: string
          currentFilename: string
          title: string
          files: Record<string, string>
        }
        const activeFilename = parsed.activeFilename ?? parsed.currentFilename
        return {
          workspaceId,
          activeFilename,
          files: {
            [activeFilename]: '',
            ...parsed.files,
          },
          title: parsed.title ?? workspaceId,
        }
      }
      throw new Error(`Workspace ${key} not found`)
    } catch (e) {
      console.error(`Error reading fromStorage ${key}:`, e)
      return null
    }
  },
  /**
   * @returns key to read the workspace back
   */
  write(workspace: {
    workspaceId: string
    activeFilename: string
    title: string
    files: Record<string, string>
  }) {
    localStorage.setItem(
      `likec4:workspace:${workspace.workspaceId}`,
      JSON.stringify({
        activeFilename: workspace.activeFilename,
        title: workspace.title,
        files: workspace.files,
      }),
    )
    return `likec4:workspace:${workspace.workspaceId}`
  },
}
