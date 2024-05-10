import { type DetailedHTMLFactory, type HTMLAttributes, useRef, useState } from 'react'

import { MantineProvider } from '@mantine/core'
import { useIsomorphicLayoutEffect } from '@react-hookz/web'
import clsx from 'clsx'
import root from 'react-shadow'
import { theme, useCreateStyleSheet } from './styles'
import { cssRoot } from './styles.css'

const Root: DetailedHTMLFactory<
  HTMLAttributes<HTMLDivElement> & {
    styleSheets?: CSSStyleSheet[]
    ssr?: boolean
  },
  HTMLDivElement
> = root.div as any

type ShadowRootProps = HTMLAttributes<HTMLDivElement> & {
  rootClassName?: string
  injectFontCss?: boolean | undefined
  colorScheme: 'light' | 'dark'
}

const rootSelector = `.${cssRoot}`

export function ShadowRoot({
  children,
  rootClassName,
  colorScheme,
  injectFontCss,
  ...props
}: ShadowRootProps) {
  const mantineRootRef = useRef<HTMLDivElement>(null)
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
      <div ref={mantineRootRef} className={clsx(cssRoot, rootClassName)} data-mantine-color-scheme={colorScheme}>
        <MantineProvider
          forceColorScheme={colorScheme}
          getRootElement={() => mantineRootRef.current ?? undefined}
          cssVariablesSelector={rootSelector}
          theme={theme}>
          {children}
        </MantineProvider>
      </div>
    </Root>
  )
}
