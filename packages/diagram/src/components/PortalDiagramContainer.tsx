import { Portal } from '@mantine/core'
import {
  type PropsWithChildren,
  useContext,
} from 'react'
import { RootContainerContext } from '../context/RootContainerContext'

/**
 * PortalDiagramContainer is used to render elements outside the LikeC4DiagramXYFlow, but inside the container.
 * It is used internally by the library.
 */
export function PortalDiagramContainer({ children }: PropsWithChildren) {
  const ctx = useContext(RootContainerContext)
  if (!ctx) {
    throw new Error('PortalToRootContainer must be used within LikeC4Diagram')
  }
  return <Portal target={ctx.ref.current ?? `#${ctx.id}`}>{children}</Portal>
}
