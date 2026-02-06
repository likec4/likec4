import {
  type CurrentViewModel,
  useOptionalCurrentViewModel,
} from '../context/LikeC4ModelContext'

export type { CurrentViewModel }

export {
  useOptionalCurrentViewModel,
}

/**
 * Hook to get the current view model from the context.
 * Throws an error if no view model is found in the context.
 *
 * @see useOptionalCurrentViewModel
 */
export function useCurrentViewModel(): CurrentViewModel {
  const vm = useOptionalCurrentViewModel()
  if (!vm) {
    throw new Error('No CurrentViewModelContext found')
  }
  return vm
}
