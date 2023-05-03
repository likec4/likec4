import { clone } from 'rambdax'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { BigBankPlayground } from './initial/bigbank'

export interface FilesStore {
  current: string
  files: Record<string, string>
}

export const useFilesStore = create<FilesStore>()(
  persist((_set) => {
    return clone(BigBankPlayground)
  }, {
    name: 'likec4-playground-files',
    storage: createJSONStorage(() => sessionStorage),
  })
)

export const switchToFile = (filename: string) => {
  const { current, files } = useFilesStore.getState()
  if (current !== filename && filename in files) {
    useFilesStore.setState({ current: filename })
  }
}

export const updateFile = (filename: string, value: string) => {
  useFilesStore.setState({
    files: {
      [filename]: value
    }
  })
}
