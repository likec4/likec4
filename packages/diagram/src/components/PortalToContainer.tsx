import { Portal } from '@mantine/core'
import type {
  PropsWithChildren,
} from 'react'
import { useRootContainerContext } from '../context/RootContainerContext'

/**
 * PortalToContainer is used to render elements outside the LikeC4DiagramXYFlow, but inside the container.
 * It is used internally by the library.
 */
export function PortalToContainer({ children }: PropsWithChildren) {
  const ctx = useRootContainerContext()
  if (!ctx) {
    throw new Error('PortalToContainer must be used within RootContainer')
  }
  return <Portal target={ctx.ref.current ?? ctx.selector}>{children}</Portal>
}
