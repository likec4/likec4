// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { WebappExportFormat } from '@likec4/config'

const WebappExportFormats = [
  'png',
  'jpg',
  'dot',
  'd2',
  'mmd',
  'puml',
  'drawio',
] as const satisfies readonly WebappExportFormat[]

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
