import { createTheme, MantineContext, MantineProvider } from '@mantine/core'
import { type PropsWithChildren, useContext } from 'react'
import type { LikeC4DiagramProperties } from '../LikeC4Diagram.props'

type EnsureMantineProps = PropsWithChildren<Pick<LikeC4DiagramProperties, 'colorMode'>>

const theme = createTheme({
  primaryColor: 'indigo',
  cursorType: 'pointer',
  headings: {
    fontWeight: '500',
    sizes: {
      h1: {
        // fontSize: '2rem',
        fontWeight: '600'
      },
      h2: {
        // fontSize: '1.85rem',
      }
    }
  }
})

export function EnsureMantine({ colorMode, children }: EnsureMantineProps) {
  const mantineCtx = useContext(MantineContext)
  if (mantineCtx) {
    mantineCtx.getRootElement
    return <>{children}</>
  }
  return (
    <MantineProvider
      {...(colorMode && {
        forceColorScheme: colorMode
      })}
      theme={theme}
      defaultColorScheme="auto"
    >
      {children}
    </MantineProvider>
  )
}
