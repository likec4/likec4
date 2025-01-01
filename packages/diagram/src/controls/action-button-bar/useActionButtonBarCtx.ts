import type { Variants } from 'framer-motion'
import { createContext, useContext } from 'react'

export const ActionButtonBarContext = createContext<
  {
    variants: Variants
    ['data-animate-target']?: string
  } | null
>(null)

export function useActionButtonBarCtx() {
  return useContext(ActionButtonBarContext)
}
