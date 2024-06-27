import { type HTMLAttributes, type PropsWithChildren, useRef } from 'react'

import { MantineProvider } from '@mantine/core'
import clsx from 'clsx'
import { theme } from './styles'
import { cssRoot } from './styles.css'

type ShadowRootMantineProps = PropsWithChildren<{
  rootClassName?: string | undefined
  colorScheme?: 'light' | 'dark' | undefined
}>

const rootSelector = `.${cssRoot}`

export function ShadowRootMantine({
  children,
  rootClassName,
  colorScheme
}: ShadowRootMantineProps) {
  const mantineRootRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={mantineRootRef}
      className={clsx(cssRoot, rootClassName)}
      {...(colorScheme && { 'data-mantine-color-scheme': colorScheme })}
    >
      <MantineProvider
        {...(colorScheme && { forceColorScheme: colorScheme })}
        defaultColorScheme={colorScheme ?? 'dark'}
        getRootElement={() => mantineRootRef.current ?? undefined}
        cssVariablesSelector={rootSelector}
        theme={theme}>
        {children}
      </MantineProvider>
    </div>
  )
}
