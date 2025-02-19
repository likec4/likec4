import { useLocalStorage } from '@mantine/hooks'

export const LikeC4WorkspacesKey = 'likec4:workspaces'
export type LocalStorageWorkspace = {
  key: string
  name: string // path-prefix
  title: string
}

export function useWorkspaces() {
  return useLocalStorage<LocalStorageWorkspace[]>({
    key: LikeC4WorkspacesKey,
    defaultValue: [],
  })
}
