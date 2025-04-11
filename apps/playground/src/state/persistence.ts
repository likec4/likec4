import { Examples } from '$/examples'
import { invariant } from '@tanstack/react-router'
import { first, keys } from 'remeda'
import type { LocalWorkspace } from './types'

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
          const parsed = JSON.parse(fromStorage) as LocalWorkspace & {
            currentFilename?: string
          }
          let activeFilename = parsed.activeFilename || parsed.currentFilename
          if (!activeFilename) {
            activeFilename = first(keys(parsed.files))
          }
          invariant(activeFilename, 'activeFilename is required')
          return {
            ...parsed,
            workspaceId,
            activeFilename,
            files: {
              [activeFilename]: '',
              ...parsed.files,
            },
            title: parsed.title ?? workspaceId,
          } satisfies LocalWorkspace
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
    write({ shareHistory, ...workspace }: LocalWorkspace) {
      storage.setItem(
        `likec4:workspace:${workspace.workspaceId}`,
        JSON.stringify({
          ...workspace,
          ...shareHistory && shareHistory.length > 0 && { shareHistory },
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
