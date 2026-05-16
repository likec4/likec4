// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

/**
 * Normalizes boolean export search params that can arrive from TanStack Router or URL strings.
 */
export function isExportSearchFlagEnabled(value: unknown): boolean {
  return value === true || value === 'true'
}
