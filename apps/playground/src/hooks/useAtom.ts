import type { WritableAtom } from 'nanostores'
import { useStore } from '@nanostores/react'
import { useCallback } from 'react'

export const useAtom = <T>(atom: WritableAtom<T>) => {
  const state = useStore(atom)

  const setAtom = useCallback(
    (newState: T) => {
      atom.set(newState)
    },
    [atom],
  )
  return [state, setAtom] as const
}
