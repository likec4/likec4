import { MantineProvider } from '@mantine/core'
import clsx from 'clsx'
import { type PropsWithChildren, useRef } from 'react'
import { ShadowRootCssSelector, theme } from './styles'
import { cssRoot } from './styles.css'

type ShadowRootMantineProps = PropsWithChildren<{
  className?: string | undefined
  colorScheme?: 'light' | 'dark' | undefined
}>
export function ShadowRootMantineProvider({
  children,
  className,
  colorScheme
}: ShadowRootMantineProps) {
  const mantineRootRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={mantineRootRef}
      className={clsx(cssRoot, className)}
      {...(colorScheme && { 'data-mantine-color-scheme': colorScheme })}
    >
      <MantineProvider
        {...(colorScheme && { forceColorScheme: colorScheme })}
        getRootElement={() => mantineRootRef.current ?? undefined}
        cssVariablesSelector={ShadowRootCssSelector}
        theme={theme}>
        {children}
      </MantineProvider>
    </div>
  )
}
