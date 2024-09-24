import { type PropsWithChildren, useEffect, useRef } from 'react'
import { type CreatedWorkspaceStore, type CreateWorkspaceStore, createWorkspaceStore } from './store'
import { WorkspaceContext } from './WorkspaceContext'

// export type WorkspaceContextValue = ReturnType<CreateWorkspaceStore>
export function WorkspaceContextProvider({ children, ...props }: PropsWithChildren<CreateWorkspaceStore>) {
  const store = useRef<CreatedWorkspaceStore>()

  if (!store.current) {
    store.current = createWorkspaceStore(props)
  }

  const name = props.name

  useEffect(
    () => {
      if (store.current?.getState().name !== name) {
        throw new Error('Workspace name cannot be changed, force remount')
      }
    },
    [name]
  )

  /**
   * This is a temporary hack to expose the diagram as DOT
   * to the global scope for debugging purposes
   */
  useEffect(() => {
    // @ts-ignore
    globalThis['currentDiagram'] = () => {
      const {
        diagrams,
        viewId
      } = store.current!.getState()
      console.dir({
        viewId,
        ...diagrams[viewId]
      })
    }
    return () => {
      // @ts-ignore
      delete globalThis['currentDiagram']
    }
  }, [])

  return (
    <WorkspaceContext.Provider value={store.current}>
      {children}
    </WorkspaceContext.Provider>
  )
}
