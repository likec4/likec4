// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { type WebappExportFormat, WebappExportFormats } from '@likec4/config/webapp-export-formats'

type ProjectExportCapabilities = {
  exportFormats?: readonly WebappExportFormat[] | undefined
}

/**
 * Returns enabled webapp export formats in canonical menu order.
 */
export function enabledWebappExportFormats(project: ProjectExportCapabilities): WebappExportFormat[] {
  const configured = project.exportFormats
  if (!configured) {
    return [...WebappExportFormats]
  }
  const enabledFormats = new Set(configured)
  return WebappExportFormats.filter(format => enabledFormats.has(format))
}
