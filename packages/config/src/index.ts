// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

export type {
  AIChatConfig,
  GeneratorFn,
  GeneratorFnContext,
  GeneratorFnParams,
  LikeC4ProjectConfig,
  LikeC4ProjectConfigInput,
  LikeC4ProjectJsonConfig,
  LocateResult,
} from './schema'

export {
  LikeC4ProjectConfigOps,
} from './schema'

export type {
  IncludeConfig,
} from './schema.include'

export type {
  LikeC4ConfigThemeInput,
  LikeC4StylesConfig,
  LikeC4StylesConfigInput,
  ThemeColorValuesInput,
} from './schema.theme'

export {
  LikeC4StylesConfigSchema,
} from './schema.theme'

export {
  ConfigFilenames,
  isLikeC4Config,
  isLikeC4JsonConfig,
  isLikeC4NonJsonConfig,
} from './filenames'

export {
  defineConfig,
  defineGenerators,
  defineStyle,
  defineTheme,
  defineThemeColor,
} from './define-config'
