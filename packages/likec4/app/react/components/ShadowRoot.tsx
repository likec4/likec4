import { type DetailedHTMLFactory, type HTMLAttributes } from 'react'

import root from 'react-shadow'
import { useBundledStyleSheet } from './style'

const Root: DetailedHTMLFactory<
  HTMLAttributes<HTMLDivElement> & {
    styleSheets?: CSSStyleSheet[]
    mode?: 'open' | 'closed'
    delegatesFocus?: boolean
    ssr?: boolean
  },
  HTMLDivElement
> = root.div as any

type ShadowRootProps = HTMLAttributes<HTMLDivElement> & {
  injectFontCss?: boolean | undefined
}

export function ShadowRoot({
  children,
  injectFontCss = true,
  ...props
}: ShadowRootProps) {
  const styleSheets = useBundledStyleSheet(injectFontCss)
  return (
    <Root styleSheets={styleSheets} {...props}>
      {children}
    </Root>
  )
}
