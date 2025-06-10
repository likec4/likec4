import { createSafeContext } from '@mantine/core'
import { useSelector } from '@xstate/react'
import { useCallback, useDeferredValue } from 'react'
import type { SearchActorRef, SearchActorSnapshot } from './searchActor'

export const [SearchActorContext, useSearchActor] = createSafeContext<SearchActorRef>('SearchActorContext')

const selectSearchValue = (s: SearchActorSnapshot) => s.context.searchValue
export function useSearch(): [string, (search: string) => void] {
  const searchActorRef = useSearchActor()
  const searchValue = useSelector(searchActorRef, selectSearchValue)
  const updateSearch = useCallback((search: string) => {
    searchActorRef.send({ type: 'change.search', search })
  }, [searchActorRef])
  return [searchValue, updateSearch]
}

const selectNormalizedSearchValue = (s: SearchActorSnapshot) => {
  const v = s.context.searchValue.trim().toLowerCase()
  return v.length > 1 ? v : ''
}
export function useNormalizedSearch() {
  const searchActorRef = useSearchActor()
  return useDeferredValue(useSelector(searchActorRef, selectNormalizedSearchValue))
}

export function useUpdateSearch() {
  const searchActorRef = useSearchActor()
  return useCallback((search: string) => {
    searchActorRef.send({ type: 'change.search', search })
  }, [searchActorRef])
}

const selectPickViewFor = (s: SearchActorSnapshot) => s.context.pickViewFor
export function usePickViewFor() {
  const searchActorRef = useSearchActor()
  return useSelector(searchActorRef, selectPickViewFor)
}
