import { MantineContext, MantineProvider } from '@mantine/core'
import { type PropsWithChildren, useContext } from 'react'
import type { LikeC4DiagramProperties } from '../LikeC4Diagram.props'
import { theme } from './theme'

type EnsureMantineProps = PropsWithChildren<Pick<LikeC4DiagramProperties, 'colorScheme'>>

export function EnsureMantine({ colorScheme, children }: EnsureMantineProps) {
  const mantineCtx = useContext(MantineContext)
  if (mantineCtx) {
    return <>{children}</>
  }
  return (
    <MantineProvider
      {...(colorScheme && {
        forceColorScheme: colorScheme
      })}
      theme={theme}
      defaultColorScheme="auto"
    >
      {children}
    </MantineProvider>
  )
}
