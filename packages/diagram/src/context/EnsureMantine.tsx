import { MantineContext } from '@mantine/core'
import { type PropsWithChildren, useContext, useEffect } from 'react'
import { DefaultMantineProvider } from './DefaultMantineProvider'

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
      <DefaultMantineProvider>
        {children}
      </DefaultMantineProvider>
    )
  }

  return <>{children}</>
}
