import type { MantineThemeOverride } from '@mantine/core'
import { useMergedRef } from '@mantine/hooks'
import { type HTMLAttributes, forwardRef, memo, useRef, useState } from 'react'
import root from 'react-shadow'
import { isDefined } from 'remeda'
import { DefaultMantineProvider } from '../context/DefaultMantineProvider'
import { FramerMotionConfig } from '../context/FramerMotionConfig'
import { useCallbackRef } from '../hooks/useCallbackRef'
import { useId } from '../hooks/useId'
import { useBundledStyleSheet, useColorScheme } from './styles.css'

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

export const ShadowRoot = forwardRef<HTMLDivElement, ShadowRootProps>((
  {
    children,
    theme,
    injectFontCss = true,
    styleNonce,
    colorScheme: explicitColorScheme,
    keepAspectRatio = false,
    ...props
  },
  ref,
) => {
  const colorScheme = useColorScheme(explicitColorScheme)
  const id = useId()
  const cssstyle = useShadowRootStyle(id, keepAspectRatio)
  const rootRef = useRef<HTMLDivElement>(null)
  const styleSheets = useBundledStyleSheet(injectFontCss, styleNonce)
  const getRootElement = useCallbackRef(() => rootRef.current ?? undefined)

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
  const [nonce] = useState(getStyleNonce)

  return (
    <>
      <MemoizedStyle nonce={nonce} cssstyle={cssstyle} />
      <Root ssr={false} {...props} styleSheets={styleSheets} data-likec4-instance={id}>
        <div
          ref={useMergedRef(rootRef, ref)}
          data-mantine-color-scheme={colorScheme}
          className={'likec4-shadow-root'}
        >
          <DefaultMantineProvider
            defaultColorScheme={colorScheme}
            getRootElement={getRootElement}
            cssVariablesSelector={'.likec4-shadow-root'}
            getStyleNonce={getStyleNonce}
            {...(explicitColorScheme && { forceColorScheme: explicitColorScheme })}
            {...theme && { theme }}>
            <FramerMotionConfig>
              {children}
            </FramerMotionConfig>
          </DefaultMantineProvider>
        </div>
      </Root>
    </>
  )
})

/**
 * @internal Memoized styles gives a performance boost during development
 */
const MemoizedStyle = memo<{
  nonce: string | undefined
  cssstyle: string
}>((
  { nonce, cssstyle },
) => (
  <style
    type="text/css"
    nonce={nonce}
    dangerouslySetInnerHTML={{ __html: cssstyle }} />
))
MemoizedStyle.displayName = 'MemoizedStyle'
