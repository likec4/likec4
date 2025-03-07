import { createOptionalContext } from '@mantine/core'
import { type ReactNode } from 'react'

export type ControlsCustomLayoutProps = {
  burgerMenu: ReactNode
  navigationButtons: ReactNode
  search: ReactNode
  actionsGroup: ReactNode
  syncInProgressBadge: ReactNode
}
export type ControlsCustomLayout = (props: ControlsCustomLayoutProps) => ReactNode

export const [
  ControlsCustomLayoutProvider,
  useControlsCustomLayout,
] = createOptionalContext<ControlsCustomLayout | null>(null)
