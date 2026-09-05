import { MantineContext } from '@mantine/core'
import { type PropsWithChildren, useContext, useEffect } from 'react'
import { LikeC4MantineProvider } from '../LikeC4MantineProvider'

type EnsureMantineProps = PropsWithChildren<{}>

export function EnsureMantine({ children }: EnsureMantineProps) {
  const mantineCtx = useContext(MantineContext)

  useEffect(() => {
    if (!mantineCtx) {
      console.warn('LikeC4Diagram must be a child of LikeC4MantineProvider')
    }
  }, [])

  if (!mantineCtx) {
    return (
      <LikeC4MantineProvider>
        {children}
      </LikeC4MantineProvider>
    )
  }

  return <>{children}</>
}
