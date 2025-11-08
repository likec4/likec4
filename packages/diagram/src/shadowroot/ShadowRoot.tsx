import { type MantineThemeOverride, MantineProvider } from '@mantine/core'
import { type HTMLAttributes, useCallback, useRef } from 'react'
import root from 'react-shadow'
import { isDefined } from 'remeda'
import { FramerMotionConfig } from '../context/FramerMotionConfig'
import { useCallbackRef } from '../hooks/useCallbackRef'
import { useId } from '../hooks/useId'
import { DefaultTheme, useBundledStyleSheet, useColorScheme } from './styles.css'

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

function useShadowRootStyle(
  instanceId: string,
  keepAspectRatio: false | { width: number; height: number } = false,
): string {
  if (keepAspectRatio === false) {
    return `
:where([data-likec4-instance="${instanceId}"]) {
  display: block;
  box-sizing: border-box;
  border: 0 solid transparent;
  background: transparent;
  padding: 0;
  margin: 0;
  overflow: hidden;
  width: 100%;
  height: 100%;
  min-width: 80px;
  min-height: 80px;
}
  `.trim()
  }

  const { width, height } = keepAspectRatio
  const isLandscape = width > height

  return `
:where([data-likec4-instance="${instanceId}"]) {
  display: block;
  box-sizing: border-box;
  border: 0 solid transparent;
  background: transparent;
  padding: 0;
  overflow: hidden;
  aspect-ratio: ${Math.ceil(width)} / ${Math.ceil(height)};
  ${
    isLandscape ? '' : `
  max-width: min(100%, var(--likec4-view-max-width, ${Math.ceil(width)}px));
  margin-left: auto;
  margin-right: auto;`
  }
  width: ${isLandscape ? '100%' : 'auto'};
  height: ${isLandscape ? 'auto' : '100%'};
  ${isLandscape ? `min-width: 80px;` : `min-height: 80px;`}
  max-height: min(100%, var(--likec4-view-max-height, ${Math.ceil(height)}px));
}
`.trim()
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

  const getStyleNonce = useCallbackRef(() => {
    if (isDefined(styleNonce)) {
      if (typeof styleNonce === 'string') {
        return styleNonce
      } else if (typeof styleNonce === 'function') {
        return styleNonce()
      }
    }
    return ''
  })
  let nonce = isDefined(styleNonce) ? getStyleNonce() : undefined

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
            {...!!nonce && { getStyleNonce }}
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
