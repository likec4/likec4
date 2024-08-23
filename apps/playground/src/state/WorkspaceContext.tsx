import { logger } from '@likec4/log'
import { createContext, type PropsWithChildren, useEffect, useRef } from 'react'
import { createWorkspaceStore } from './store'

type CreateWorkspaceStore = typeof createWorkspaceStore
type WorkspaceContextProps = Parameters<CreateWorkspaceStore>[0]
type WorkspaceContextValue = ReturnType<CreateWorkspaceStore>
export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceContextProvider({ children, ...props }: PropsWithChildren<WorkspaceContextProps>) {
  const store = useRef<WorkspaceContextValue>()

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
    globalThis['printDiagramDot'] = () => {
      logger.info(store.current?.getState().diagramAsDot)
    }
    return () => {
      // @ts-ignore
      delete globalThis['printDiagramDot']
    }
  }, [])

  return (
    <WorkspaceContext.Provider value={store.current}>
      {children}
    </WorkspaceContext.Provider>
  )
}
