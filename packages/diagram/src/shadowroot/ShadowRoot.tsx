import {
  type HTMLAttributes,
  type PropsWithChildren,
  memo,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { isDefined, isFunction, isString } from 'remeda'
import { DefaultMantineProvider } from '../context/DefaultMantineProvider'
import { FramerMotionConfig } from '../context/FramerMotionConfig'
import { useCallbackRef } from '../hooks'
import { useId } from '../hooks/useId'
import fontsCss from '../styles-font.css?inline'
import inlinedStyles from '../styles.css?inline'
import { scopeStylesToShadowRoot, useColorScheme } from './styles.css'

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

  const width = Math.ceil(keepAspectRatio.width)
  const height = Math.ceil(keepAspectRatio.height)
  const isLandscape = width > height

  return `
:where([data-likec4-instance="${instanceId}"]) {
  display: block;
  box-sizing: border-box;
  border: 0 solid transparent;
  background: transparent;
  padding: 0;
  overflow: hidden;
  aspect-ratio: ${width} / ${height};
  ${
    isLandscape ? '' : `
  max-width: min(100%, var(--likec4-view-max-width, ${width}px));
  margin-left: auto;
  margin-right: auto;`
  }
  width: ${isLandscape ? '100%' : 'auto'};
  height: ${isLandscape ? 'auto' : '100%'};
  ${isLandscape ? `min-width: 80px;` : `min-height: 80px;`}
  max-height: min(100%, var(--likec4-view-max-height, ${height}px));
}
`.trim()
}

type ShadowRootProps = HTMLAttributes<HTMLDivElement> & {
  injectFontCss?: boolean | undefined
  styleNonce?: string | (() => string) | undefined
  colorScheme?: 'light' | 'dark' | undefined
  keepAspectRatio?: false | undefined | { width: number; height: number }
  /**
   * Mantine theme override to apply within the shadow root
   * @see https://mantine.dev/theming/mantine-provider/#theme-prop
   */
  theme?: any
}
export function ShadowRoot({
  children,
  theme,
  injectFontCss = true,
  styleNonce,
  colorScheme: explicitColorScheme,
  keepAspectRatio = false,
  ...props
}: ShadowRootProps) {
  const colorScheme = useColorScheme(explicitColorScheme)
  const id = useId()
  const cssstyle = useShadowRootStyle(id, keepAspectRatio)
  const mantineRootRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(
    () => appendFontToDocument(injectFontCss, styleNonce),
    [],
  )
  const getRootElement = useCallbackRef(() => mantineRootRef.current ?? undefined)

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
  const nonce = getStyleNonce()

  return (
    <>
      <MemoizedStyle nonce={nonce} cssstyle={cssstyle} />
      <ShadowRootHost {...props} data-likec4-instance={id}>
        <div ref={mantineRootRef} data-mantine-color-scheme={colorScheme} className={'likec4-shadow-root'}>
          <DefaultMantineProvider
            defaultColorScheme={colorScheme}
            getRootElement={getRootElement}
            cssVariablesSelector={'.likec4-shadow-root'}
            withCssVariables={true}
            getStyleNonce={getStyleNonce}
            theme={theme}
            {...(explicitColorScheme && { forceColorScheme: explicitColorScheme })}
          >
            <FramerMotionConfig>
              {children}
            </FramerMotionConfig>
          </DefaultMantineProvider>
        </div>
      </ShadowRootHost>
    </>
  )
}

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
    {...({ nonce })}
    dangerouslySetInnerHTML={{ __html: cssstyle }} />
), shallowEqual)
MemoizedStyle.displayName = 'MemoizedStyle'

const ShadowRootHostPortal = ({ children, root }: PropsWithChildren<{ root: ShadowRoot }>) => {
  return createPortal(children, root, 'likec4-shadow-root')
}

const ShadowRootHost = ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => {
  const hostRef = useRef<HTMLDivElement>(null)
  const [root, setRoot] = useState<globalThis.ShadowRoot | null>(null)

  const styles = shadowRootCSS()

  const updateShadowRoot = useEffectEvent((styles: string) => {
    setRoot(current => {
      const host = hostRef.current
      if (!host) {
        return null
      }
      if (host.shadowRoot) {
        try {
          if (host.shadowRoot.adoptedStyleSheets?.length !== 1) {
            console.error(
              'Shadow root has unexpected number of style sheets (expected 1, got %d)',
              host.shadowRoot.adoptedStyleSheets?.length ?? 0,
            )
            return host.shadowRoot
          }
          host.shadowRoot.adoptedStyleSheets[0]!.replaceSync(styles)
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error(error)
          }
        }
        return host.shadowRoot
      }
      try {
        const shadowRoot = host.attachShadow({
          mode: 'open',
          delegatesFocus: false,
        })
        shadowRoot.adoptedStyleSheets = createShadowRootStylesheets(styles)
        return shadowRoot
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(error)
        }
        return current
      }
    })
  })

  useLayoutEffect(() => {
    updateShadowRoot(styles)
  }, [styles])

  return (
    <div {...props} ref={hostRef}>
      {root && (
        <ShadowRootHostPortal root={root}>
          {children}
        </ShadowRootHostPortal>
      )}
    </div>
  )
}

function appendFontToDocument(injectFontCss: boolean, styleNonce?: string | (() => string) | undefined) {
  if (injectFontCss && !document.querySelector(`style[data-likec4-font]`)) {
    const style = document.createElement('style')
    style.setAttribute('type', 'text/css')
    style.setAttribute('data-likec4-font', '')

    let nonce: string | undefined
    if (isString(styleNonce)) {
      nonce = styleNonce
    }
    if (isFunction(styleNonce)) {
      nonce = styleNonce()
    }
    if (nonce) {
      style.setAttribute('nonce', nonce)
    }

    style.appendChild(document.createTextNode(scopeStylesToShadowRoot(fontsCss)))
    document.head.appendChild(style)
  }
}
/**
 * Creates a CSS string with styles scoped to the shadow root
 * KEEP Private helps with HMR
 */
function createShadowRootStyles() {
  return scopeStylesToShadowRoot(inlinedStyles)
}

/**
 * Creates a CSSStyleSheet with styles scoped to the shadow root
 * KEEP Private helps with HMR
 */
function createShadowRootStylesheets() {
  const css = new CSSStyleSheet()
  css.replaceSync(createShadowRootStyles())
  return [css] as [CSSStyleSheet]
}
