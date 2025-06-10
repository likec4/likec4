import { MantineContext, MantineProvider } from '@mantine/core'
import { type PropsWithChildren, useContext, useEffect } from 'react'

type EnsureMantineProps = PropsWithChildren<{}>

export function EnsureMantine({ children }: EnsureMantineProps) {
  const mantineCtx = useContext(MantineContext)

  useEffect(() => {
    if (!mantineCtx) {
      console.warn('LikeC4Diagram must be a child of MantineProvider')
    }
  }, [])

  if (!mantineCtx) {
    return (
      <MantineProvider defaultColorScheme="auto">
        {children}
      </MantineProvider>
    )
  }

  return <>{children}</>
}
EnsureMantine.displayName = 'EnsureMantine'
