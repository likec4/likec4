import { fromMediaQuery } from '@nanostores/media-query'
import { useStore } from '@nanostores/react'

export const $isPrint = fromMediaQuery('print')

/**
 * Hook to determine if the current media is print.
 */
export function useMediaPrint(): boolean {
  return useStore($isPrint)
}
