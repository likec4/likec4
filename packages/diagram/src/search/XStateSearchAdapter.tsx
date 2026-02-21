// SPDX-License-Identifier: MIT
//
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { Fqn, ViewId } from '@likec4/core/types'
import { useSelector } from '@xstate/react'
import { type PropsWithChildren, useMemo } from 'react'
import { useCallbackRef } from '../hooks/useCallbackRef'
import { useCurrentViewId } from '../hooks/useCurrentView'
import type { SearchActorRef, SearchActorSnapshot } from './searchActor'
import { type SearchContextValue, normalizeSearch, SearchContext } from './SearchContext'

const selectSearchValue = (s: SearchActorSnapshot) => s.context.searchValue
const selectPickViewFor = (s: SearchActorSnapshot) => s.context.pickViewFor
const selectOpenedWithSearch = (s: SearchActorSnapshot) => s.context.openedWithSearch

export function XStateSearchAdapter({
  searchActorRef,
  children,
}: PropsWithChildren<{ searchActorRef: SearchActorRef }>) {
  const searchValue = useSelector(searchActorRef, selectSearchValue)
  const pickViewFor = useSelector(searchActorRef, selectPickViewFor)
  const openedWithSearch = useSelector(searchActorRef, selectOpenedWithSearch)
  const currentViewId = useCurrentViewId()

  const setSearchValue = useCallbackRef((search: string) => {
    searchActorRef.send({ type: 'change.search', search })
  })

  const navigateTo = useCallbackRef((viewId: ViewId, focusOnElement?: Fqn) => {
    searchActorRef.send({
      type: 'navigate.to',
      viewId,
      focusOnElement,
    })
  })

  const openPickView = useCallbackRef((elementFqn: Fqn) => {
    searchActorRef.send({ type: 'pickview.open', elementFqn })
  })

  const closePickView = useCallbackRef(() => {
    searchActorRef.send({ type: 'pickview.close' })
  })

  const close = useCallbackRef(() => {
    searchActorRef.send({ type: 'close' })
  })

  const value = useMemo((): SearchContextValue => ({
    searchValue,
    setSearchValue,
    normalizedSearch: normalizeSearch(searchValue),
    navigateTo,
    openPickView,
    closePickView,
    pickViewFor,
    close,
    currentViewId,
    openedWithSearch,
  }), [
    searchValue,
    pickViewFor,
    currentViewId,
    openedWithSearch,
    // stable refs from useCallbackRef — listed for exhaustive-deps lint rule
    setSearchValue,
    navigateTo,
    openPickView,
    closePickView,
    close,
  ])

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  )
}
