import { lazy } from 'react'

export const AdHocViewEditor = lazy(async () => {
  const { AdHocViewEditor } = await import('./AdHocViewEditor')
  return {
    default: AdHocViewEditor,
  }
})
