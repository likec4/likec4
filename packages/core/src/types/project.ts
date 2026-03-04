// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { PartialDeep, WritableDeep } from 'type-fest'
import type { LikeC4StyleDefaults, LikeC4Theme } from '../styles/types'
import type { ProjectId } from './scalar'

export type LikeC4ProjectTheme = PartialDeep<WritableDeep<LikeC4Theme>, {
  recurseIntoArrays: false
  allowUndefinedInNonTupleArrays: false
}>

export type LikeC4ProjectStyleDefaults = PartialDeep<WritableDeep<LikeC4StyleDefaults>, {
  recurseIntoArrays: false
  allowUndefinedInNonTupleArrays: false
}>

export interface LikeC4ProjectStylesCustomStylesheets {
  /**
   * List of paths to CSS files, relative to the project root
   * (available in LSP, but not in dumped JSON)
   */
  paths?: string[]
  /**
   * Merged CSS
   */
  content: string
}

export interface LikeC4ProjectStylesConfig {
  theme?: LikeC4ProjectTheme
  defaults?: LikeC4ProjectStyleDefaults
  customCss?: LikeC4ProjectStylesCustomStylesheets
}

export interface LikeC4ProjectManualLayoutsConfig {
  outDir: string
}

/**
 * Configuration of the project, as read from the config file.
 * LikeC4 projects encapsulate models, and can import from each other
 */
export interface LikeC4Project {
  /**
   * ID of the project, casted to {@link ProjectId}
   */
  readonly id: ProjectId

  /**
   * Title of the project
   */
  title?: string

  /**
   * Contact person for the project
   */
  contactPerson?: string | undefined

  /**
   * Arbitrary metadata as key-value pairs
   */
  metadata?: Record<string, unknown> | undefined

  /**
   * Custom styles
   */
  styles?: LikeC4ProjectStylesConfig | undefined

  /**
   * Configuration for manual layouts snapshots
   */
  manualLayouts?: LikeC4ProjectManualLayoutsConfig | undefined

  /**
   * Automatically derive element technology from icon name
   * when technology is not explicitly set.
   * Applies to aws:, azure:, gcp:, and tech: icons.
   * Defaults to true.
   */
  inferTechnologyFromIcon?: boolean | undefined

  /**
   * AI Chat provider configuration (OpenAI-compatible endpoint)
   */
  aiChat?: {
    enabled?: boolean | undefined
    baseUrl?: string | undefined
    model?: string | undefined
    apiKey?: string | undefined
    allowUnsafeApiKey?: boolean | undefined
    suggestedQuestions?: {
      element?: string[] | undefined
    } | undefined
    systemPrompt?: string | undefined
  } | undefined
}
