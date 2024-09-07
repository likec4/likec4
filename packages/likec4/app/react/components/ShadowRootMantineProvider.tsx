import { createTheme, MantineProvider, type MantineTheme } from '@mantine/core'
import clsx from 'clsx'
import { type PropsWithChildren, useRef } from 'react'
import { ShadowRootCssSelector } from './styles'
import { shadowRoot } from './styles.css'

const theme = createTheme({
  autoContrast: true,
  primaryColor: 'indigo',
  cursorType: 'pointer',
  defaultRadius: 'sm',
  fontFamily: 'var(--likec4-default-font-family)',
  headings: {
    fontWeight: '500',
    sizes: {
      h1: {
        // fontSize: '2rem',
        fontWeight: '600'
      },
      h2: {
        fontWeight: '500'
        // fontSize: '1.85rem',
      }
    }
  }
}) as MantineTheme

type ShadowRootMantineProps = PropsWithChildren<{
  className?: string | undefined
  colorScheme?: 'light' | 'dark' | undefined
}>
export function ShadowRootMantineProvider({
  children,
  className,
  colorScheme
}: ShadowRootMantineProps) {
  const mantineRootRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={mantineRootRef}
      className={clsx(shadowRoot, className)}
      {...(colorScheme && { 'data-mantine-color-scheme': colorScheme })}
    >
      <MantineProvider
        {...(colorScheme && { forceColorScheme: colorScheme })}
        defaultColorScheme={'auto'}
        getRootElement={() => mantineRootRef.current ?? undefined}
        cssVariablesSelector={ShadowRootCssSelector}
        theme={theme}>
        {children}
      </MantineProvider>
    </div>
  )
}
