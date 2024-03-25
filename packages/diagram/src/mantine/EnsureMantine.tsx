import { MantineContext, MantineProvider } from '@mantine/core'
import { type PropsWithChildren, useContext } from 'react'
import type { LikeC4DiagramProperties } from '../LikeC4Diagram.props'

type EnsureMantineProps = PropsWithChildren<Pick<LikeC4DiagramProperties, 'colorMode'>>

export function EnsureMantine({ colorMode, children }: EnsureMantineProps) {
  const mantineCtx = useContext(MantineContext)
  if (mantineCtx) {
    return <>{children}</>
  }
  return (
    <MantineProvider
      {...(colorMode && {
        forceColorScheme: colorMode
      })}
      defaultColorScheme="auto"
    >
      {children}
    </MantineProvider>
  )
}
