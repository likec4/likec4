// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { LikeC4ProjectConfig } from '@likec4/config'
import { type WebappExportFormat, WebappExportFormats } from '@likec4/config/webapp-export-formats'

type WebappExportConfig = Pick<LikeC4ProjectConfig, 'webapp'>

export function effectiveWebappExportFormats(config: WebappExportConfig): WebappExportFormat[] {
  const configured = config.webapp?.exportFormats
  if (!configured) {
    return [...WebappExportFormats]
  }
  const enabledFormats = new Set(configured)
  return WebappExportFormats.filter(format => enabledFormats.has(format))
}

export function isWebappExportFormatEnabled(config: WebappExportConfig, format: WebappExportFormat): boolean {
  return effectiveWebappExportFormats(config).includes(format)
}
