import { Examples } from '$/examples'
import { invariant } from '@tanstack/react-router'
import { first, keys } from 'remeda'

export function readWorkspace(key: string): any {
  const value = localStorage.getItem(key)
  return value ? JSON.parse(value) : null
}

function workspacePersistence(storage: Storage) {
  return {
    read(workspaceId: string) {
      const key = `likec4:workspace:${workspaceId}`
      try {
        let fromStorage = storage.getItem(key)
        if (fromStorage) {
          const parsed = JSON.parse(fromStorage) as {
            activeFilename?: string
            currentFilename?: string
            title: string
            files: Record<string, string>
          }
          let activeFilename = parsed.activeFilename || parsed.currentFilename
          if (!activeFilename) {
            activeFilename = first(keys(parsed.files))
          }
          invariant(activeFilename, 'activeFilename is required')
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
        return null
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
      storage.setItem(
        `likec4:workspace:${workspace.workspaceId}`,
        JSON.stringify({
          activeFilename: workspace.activeFilename,
          currentFilename: workspace.activeFilename,
          title: workspace.title,
          files: workspace.files,
        }),
      )
      return `likec4:workspace:${workspace.workspaceId}`
    },
  }
}

// TEMP: This is a temporary function to write workspace to localStorage
export const WorkspacePersistence = workspacePersistence(localStorage)
export const WorkspaceSessionPersistence = workspacePersistence(sessionStorage)

export function selectWorkspacePersistence(workspaceId: string) {
  return workspaceId in Examples ? WorkspaceSessionPersistence : WorkspacePersistence
}
