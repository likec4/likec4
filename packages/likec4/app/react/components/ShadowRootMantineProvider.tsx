import { type MantineThemeOverride, MantineProvider } from '@mantine/core'
import { useCallbackRef } from '@mantine/hooks'
import clsx from 'clsx'
import { type PropsWithChildren, useRef } from 'react'
import { isDefined } from 'remeda'
import { DefaultTheme, ShadowRootCssSelector } from './style'
import { shadowRoot } from './styles.css'

type ShadowRootMantineProps = PropsWithChildren<{
  theme?: MantineThemeOverride | undefined
  className?: string | undefined
  colorScheme?: 'light' | 'dark' | undefined
  styleNonce?: string | (() => string) | undefined
}>
export function ShadowRootMantineProvider({
  theme = DefaultTheme,
  children,
  className,
  colorScheme,
  styleNonce,
}: ShadowRootMantineProps) {
  const mantineRootRef = useRef<HTMLDivElement>(null)

  let getStyleNonce
  if (isDefined(styleNonce)) {
    getStyleNonce = typeof styleNonce === 'function' ? styleNonce : () => styleNonce
  }

  const getRootElement = useCallbackRef(() => mantineRootRef.current ?? undefined)

  return (
    <div
      ref={mantineRootRef}
      className={clsx(shadowRoot, className)}
      {...(colorScheme && { 'data-mantine-color-scheme': colorScheme })}
    >
      <MantineProvider
        {...(colorScheme && { forceColorScheme: colorScheme })}
        defaultColorScheme={'auto'}
        getRootElement={getRootElement}
        {...getStyleNonce && { getStyleNonce }}
        cssVariablesSelector={ShadowRootCssSelector}
        theme={theme}>
        {children}
      </MantineProvider>
    </div>
  )
}
