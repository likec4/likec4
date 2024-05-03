import { Callout } from 'nextra/components'
import type { ReactNode } from 'react'

export function Error({ children }: { children: ReactNode }) {
  return (
    <Callout type="error" emoji="️🚫">
      {children}
    </Callout>
  )
}

export function Info({ children }: { children: ReactNode }) {
  return <Callout type="info">{children}</Callout>
}

export function Warning({ children }: { children: ReactNode }) {
  return <Callout type="warning">{children}</Callout>
}

export function Design({ children }: { children: ReactNode }) {
  return <Callout emoji="🎨">{children}</Callout>
}

export function Idea({ children }: { children: ReactNode }) {
  return <Callout>{children}</Callout>
}
