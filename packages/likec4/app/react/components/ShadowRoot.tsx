import { type DetailedHTMLFactory, type HTMLAttributes, useState } from 'react'

import { useIsomorphicLayoutEffect } from '@react-hookz/web'
import root from 'react-shadow'
import { useCreateStyleSheet } from './styles'

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
  const [styleSheets, setStyleSheets] = useState([] as CSSStyleSheet[])
  const createCssStyleSheet = useCreateStyleSheet(injectFontCss)
  useIsomorphicLayoutEffect(() => {
    const css = createCssStyleSheet()
    setStyleSheets([css])
    return () => {
      css.replaceSync('')
    }
  }, [])

  return (
    <Root styleSheets={styleSheets} {...props}>
      {children}
    </Root>
  )
}
