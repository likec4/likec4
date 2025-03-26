import { css, cx } from '@likec4/styles/css'
import { type MantineThemeOverride, MantineProvider } from '@mantine/core'
import { type HTMLAttributes, useCallback, useRef } from 'react'
import root from 'react-shadow'
import { isDefined } from 'remeda'
import { DefaultTheme, useBundledStyleSheet } from './styles.css'

const Root = root['div']!

type ShadowRootProps = HTMLAttributes<HTMLDivElement> & {
  injectFontCss?: boolean | undefined
  styleNonce?: string | (() => string) | undefined
  mode?: 'open' | 'closed'
  delegatesFocus?: boolean
  colorScheme?: 'light' | 'dark' | undefined
  theme?: MantineThemeOverride | undefined
}

export function ShadowRoot({
  children,
  theme = DefaultTheme,
  injectFontCss = true,
  styleNonce,
  colorScheme,
  ...props
}: ShadowRootProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const styleSheets = useBundledStyleSheet(injectFontCss, styleNonce)
  const getRootElement = useCallback(() => rootRef.current ?? undefined, [rootRef])

  let getStyleNonce
  if (isDefined(styleNonce)) {
    getStyleNonce = typeof styleNonce === 'function' ? styleNonce : () => styleNonce
  }

  return (
    <Root ssr={false} styleSheets={styleSheets} {...props}>
      <div
        ref={rootRef}
        {...(colorScheme && { 'data-mantine-color-scheme': colorScheme })}
        className={cx(
          'likec4-shadow-root',
          css({
            display: 'contents',
          }),
        )}
      >
        <MantineProvider
          {...(colorScheme && { forceColorScheme: colorScheme })}
          defaultColorScheme={'auto'}
          getRootElement={getRootElement}
          {...getStyleNonce && { getStyleNonce }}
          cssVariablesSelector={'.likec4-shadow-root'}
          theme={theme}>
          {children}
        </MantineProvider>
      </div>
    </Root>
  )
}
