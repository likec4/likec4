import { useSelector } from '@xstate/react'
import { useCallback, useDeferredValue } from 'react'
import { useSearchActorRef } from '../hooks/useSearchActor'
import type { SearchActorSnapshot } from './searchActor'

export function useSearchActor() {
  const searchActorRef = useSearchActorRef()
  if (!searchActorRef) {
    throw new Error('Search actor not found')
  }
  return searchActorRef
}

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
  let v = selectSearchValue(s)
  if (v === '') return v

  v = v.trim().toLowerCase()

  if (v.startsWith('#') && v.length <= 2) {
    return ''
  }
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
