// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

export {
  type AIChatConfig,
  defineConfig,
  defineGenerators,
  defineStyle,
  defineTheme,
  defineThemeColor,
  type GeneratorFn,
  type GeneratorFnContext,
  type GeneratorFnParams,
  isLikeC4Config,
  isLikeC4JsonConfig,
  isLikeC4NonJsonConfig,
  type LikeC4ProjectConfig,
  type LikeC4ProjectConfigInput,
  LikeC4ProjectConfigOps,
  type LikeC4ProjectJsonConfig,
  type LikeC4StylesConfig,
  type LikeC4StylesConfigInput,
} from '@likec4/config'
