import { unstable_batchedUpdates } from 'react-dom'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FilesStore {
  current: string
  files: Record<string, string>
}

const playgroundFile = `
// LikeC4 Playground

specification {
  element system
  element service
  element component
}

model {
  cloud = system 'Cloud' {
    service backend {
      component api
    }
  }
}
`.trimStart()

export const useFilesStore = create<FilesStore>()(
  persist((_set) => {
    return {
      current: 'file:///playground.c4',
      files: {
        'file:///playground.c4': playgroundFile
      }
    }
  }, {
    name: 'likec4-playground-files',
    // merge: (persistedState, currentState) => currentState,
  })
)

export const switchToFile = (filename: string) => {
  unstable_batchedUpdates(() => {
    const { current, files } = useFilesStore.getState()
    if (current !== filename && filename in files) {
      useFilesStore.setState({ current: filename })
    }
  })
}

export const updateFile = (filename: string, value: string) => {
  unstable_batchedUpdates(() =>
  useFilesStore.setState(({ files }) => ({
      files: {
        ...files,
        [filename]: value
      }
    }))
  )
}
