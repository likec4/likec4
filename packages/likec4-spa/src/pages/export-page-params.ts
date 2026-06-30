// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { z } from 'zod'
import { relationshipExportSearchSchema } from '../relationship-export'

export const exportPageSearchSchema = relationshipExportSearchSchema.extend({
  description: z.boolean().optional().catch(false),
  download: z.boolean().optional().catch(false),
  format: z.enum(['png', 'jpeg']).optional().catch('png'),
  notation: z.boolean().optional().catch(false),
  quality: z.number().min(0).max(1).optional().catch(undefined),
})

export const exportPageSearchDefaults = {
  description: false,
  download: false,
  format: 'png',
  notation: false,
  quality: undefined,
  relationships: undefined,
  relationshipScope: undefined,
} as const

/**
 * Normalizes boolean export search params that can arrive from TanStack Router or URL strings.
 */
export function isExportSearchFlagEnabled(value: unknown): boolean {
  return value === true || value === 'true'
}
