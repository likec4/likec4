import { type HTMLAttributes } from 'react'

import root from 'react-shadow'
import { useBundledStyleSheet } from './styles.css'

const Root = root['div']!

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
