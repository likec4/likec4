// SPDX-License-Identifier: MIT
//
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { Fqn, ViewId } from '@likec4/core/types'
import { createContext, useContext } from 'react'

export interface SearchContextValue {
  searchValue: string
  setSearchValue: (value: string) => void
  normalizedSearch: string
  navigateTo: (viewId: ViewId, focusOnElement?: Fqn) => void
  openPickView: (elementFqn: Fqn) => void
  closePickView: () => void
  pickViewFor: Fqn | null
  close: () => void
  currentViewId: string | null
  openedWithSearch: string | null
}

export const SearchContext = createContext<SearchContextValue | null>(null)

export function useSearchContext(): SearchContextValue {
  const ctx = useContext(SearchContext)
  if (!ctx) {
    throw new Error('useSearchContext must be used within a SearchContext.Provider')
  }
  return ctx
}

/**
 * Normalize a raw search string for comparison.
 * Extracted as a pure function so both XState and standalone adapters can reuse it.
 */
export function normalizeSearch(value: string): string {
  if (value === '') return value

  const v = value.trim().toLowerCase()

  if (v.startsWith('#') && v.length <= 2) {
    return ''
  }
  return v.length > 1 ? v : ''
}
