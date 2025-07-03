import { useContext } from 'react'
import { type CurrentViewModelContextType, CurrentViewModelContext } from './LikeC4ModelContext'

export function useCurrentViewModel(): CurrentViewModelContextType {
  const vm = useContext(CurrentViewModelContext)
  if (!vm) {
    throw new Error('No LikeC4ViewModel in context found')
  }
  return vm
}
