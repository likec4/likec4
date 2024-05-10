import { MantineContext } from '@mantine/core'
import { type PropsWithChildren, useContext } from 'react'

type EnsureMantineProps = PropsWithChildren<{}>

export function EnsureMantine({ children }: EnsureMantineProps) {
  const mantineCtx = useContext(MantineContext)

  if (!mantineCtx) {
    throw new Error('LikeC4Diagram must be a child of MantineProvider')
  }

  return <>{children}</>
}
