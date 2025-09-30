import { useContext } from 'react'
import { type CurrentViewModel, CurrentViewModelContext } from '../context/LikeC4ModelContext'

export type { CurrentViewModel }

export function useOptionalCurrentViewModel(): CurrentViewModel | null {
  return useContext(CurrentViewModelContext)
}

export function useCurrentViewModel(): CurrentViewModel {
  const vm = useContext(CurrentViewModelContext)
  if (!vm) {
    throw new Error('No LikeC4ViewModel in context found')
  }
  return vm
}
