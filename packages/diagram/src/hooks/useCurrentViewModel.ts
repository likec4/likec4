import { useContext } from 'react'
import { type CurrentViewModel, CurrentViewModelContext } from '../context/LikeC4ModelContext'

export type { CurrentViewModel }

/**
 * Returns the current view model from the context, or null if no view model is found.
 * @see useCurrentViewModel
 */
export function useOptionalCurrentViewModel(): CurrentViewModel | null {
  return useContext(CurrentViewModelContext)
}

/**
 * Hook to get the current view model from the context.
 * Throws an error if no view model is found in the context.
 *
 * @see useOptionalCurrentViewModel
 */
export function useCurrentViewModel(): CurrentViewModel {
  const vm = useContext(CurrentViewModelContext)
  if (!vm) {
    throw new Error('No LikeC4ViewModel in context found')
  }
  return vm
}
