import { type ComponentType, type HTMLAttributes } from 'react'

import root from 'react-shadow'
import { useBundledStyleSheet } from './style'

const Root: ComponentType<
  HTMLAttributes<HTMLDivElement> & {
    styleSheets?: CSSStyleSheet[]
    mode?: 'open' | 'closed'
    delegatesFocus?: boolean
    ssr?: boolean
  }
> = root.div as any

type ShadowRootProps = HTMLAttributes<HTMLDivElement> & {
  injectFontCss?: boolean | undefined
  styleNonce?: string | (() => string) | undefined
}

export function ShadowRoot({
  children,
  injectFontCss = true,
  styleNonce,
  ...props
}: ShadowRootProps) {
  const styleSheets = useBundledStyleSheet(injectFontCss, styleNonce)
  return (
    <Root styleSheets={styleSheets} {...props}>
      {children}
    </Root>
  )
}
