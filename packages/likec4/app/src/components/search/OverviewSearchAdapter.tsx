// SPDX-License-Identifier: MIT
//
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { Fqn, ViewId } from '@likec4/core/types'
import { type SearchContextValue, normalizeSearch, SearchContext } from '@likec4/diagram'
import { useNavigate } from '@tanstack/react-router'
import { type PropsWithChildren, useCallback, useMemo, useState } from 'react'

export function OverviewSearchAdapter({
  onClose,
  children,
}: PropsWithChildren<{ onClose: () => void }>) {
  const [searchValue, setSearchValue] = useState('')
  const [pickViewFor, setPickViewFor] = useState<Fqn | null>(null)
  const navigate = useNavigate()

  const navigateTo = useCallback((viewId: ViewId, focusOnElement?: Fqn) => {
    onClose()
    void navigate({
      to: '/view/$viewId/',
      params: { viewId },
      search: (prev) => ({
        ...prev,
        ...(focusOnElement && { focusOnElement }),
      }),
    })
  }, [navigate, onClose])

  const openPickView = useCallback((elementFqn: Fqn) => {
    setPickViewFor(elementFqn)
  }, [])

  const closePickView = useCallback(() => {
    setPickViewFor(null)
  }, [])

  const value = useMemo((): SearchContextValue => ({
    searchValue,
    setSearchValue,
    normalizedSearch: normalizeSearch(searchValue),
    navigateTo,
    openPickView,
    closePickView,
    pickViewFor,
    close: onClose,
    currentViewId: null,
    openedWithSearch: null,
  }), [searchValue, pickViewFor, navigateTo, openPickView, closePickView, onClose])

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  )
}
