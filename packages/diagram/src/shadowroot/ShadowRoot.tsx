import { type MantineThemeOverride, MantineProvider } from '@mantine/core'
import { type HTMLAttributes, useCallback, useRef } from 'react'
import root from 'react-shadow'
import { isDefined } from 'remeda'
import { FramerMotionConfig } from '../context/FramerMotionConfig'
import { useId } from '../hooks/useId'
import { DefaultTheme, useBundledStyleSheet, useColorScheme, useShadowRootStyle } from './styles.css'

const Root = root['div']!

type ShadowRootProps = HTMLAttributes<HTMLDivElement> & {
  injectFontCss?: boolean | undefined
  styleNonce?: string | (() => string) | undefined
  mode?: 'open' | 'closed'
  delegatesFocus?: boolean
  colorScheme?: 'light' | 'dark' | undefined
  keepAspectRatio?: false | undefined | { width: number; height: number }
  theme?: MantineThemeOverride | undefined
}

export function ShadowRoot({
  children,
  theme = DefaultTheme,
  injectFontCss = true,
  styleNonce,
  colorScheme: explicitColorScheme,
  keepAspectRatio = false,
  ...props
}: ShadowRootProps) {
  const colorScheme = useColorScheme(explicitColorScheme)
  const id = useId()
  const cssstyle = useShadowRootStyle(id, keepAspectRatio)
  const rootRef = useRef<HTMLDivElement>(null)
  const styleSheets = useBundledStyleSheet(injectFontCss, styleNonce)
  const getRootElement = useCallback(() => rootRef.current ?? undefined, [rootRef])

  let getStyleNonce
  let nonce
  if (isDefined(styleNonce)) {
    if (typeof styleNonce === 'string') {
      nonce = styleNonce
      getStyleNonce = () => styleNonce
    } else if (typeof styleNonce === 'function') {
      nonce = styleNonce()
      getStyleNonce = styleNonce
    }
  }

  return (
    <>
      <style
        type="text/css"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: cssstyle }}
      />
      <Root ssr={false} {...props} styleSheets={styleSheets} data-likec4-instance={id}>
        <div
          ref={rootRef}
          data-mantine-color-scheme={colorScheme}
          className={'likec4-shadow-root'}
        >
          <MantineProvider
            {...(explicitColorScheme && { forceColorScheme: explicitColorScheme })}
            defaultColorScheme={colorScheme}
            getRootElement={getRootElement}
            {...getStyleNonce && { getStyleNonce }}
            cssVariablesSelector={'.likec4-shadow-root'}
            theme={theme}>
            <FramerMotionConfig>
              {children}
            </FramerMotionConfig>
          </MantineProvider>
        </div>
      </Root>
    </>
  )
}
