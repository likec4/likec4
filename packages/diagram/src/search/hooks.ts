// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { useCallback, useDeferredValue } from 'react'
import { useSearchContext } from './SearchContext'

export function useSearch(): [string, (search: string) => void] {
  const ctx = useSearchContext()
  return [ctx.searchValue, ctx.setSearchValue]
}

export function useNormalizedSearch(): string {
  const ctx = useSearchContext()
  return useDeferredValue(ctx.normalizedSearch)
}

export function useUpdateSearch() {
  const { setSearchValue } = useSearchContext()
  return useCallback((search: string) => {
    setSearchValue(search)
  }, [setSearchValue])
}
