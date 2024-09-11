import { MantineProvider, type MantineThemeOverride } from '@mantine/core'
import clsx from 'clsx'
import { type PropsWithChildren, useRef } from 'react'
import { DefaultTheme, ShadowRootCssSelector } from './style'
import { shadowRoot } from './styles.css'

type ShadowRootMantineProps = PropsWithChildren<{
  theme?: MantineThemeOverride | undefined
  className?: string | undefined
  colorScheme?: 'light' | 'dark' | undefined
}>
export function ShadowRootMantineProvider({
  theme = DefaultTheme,
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
