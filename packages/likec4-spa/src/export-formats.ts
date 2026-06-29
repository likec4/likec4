// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { WebappExportFormat } from '@likec4/config'

const WEBAPP_EXPORT_FORMATS = [
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

type ImageExportSearchFormat = 'png' | 'jpeg'

export function enabledWebappExportFormats(project: ProjectExportCapabilities): WebappExportFormat[] {
  const configured = project.exportFormats
  if (!configured) {
    return [...WEBAPP_EXPORT_FORMATS]
  }
  const enabledFormats = new Set(configured)
  return WEBAPP_EXPORT_FORMATS.filter(format => enabledFormats.has(format))
}

export function hasAnyWebappExportFormatEnabled(project: ProjectExportCapabilities): boolean {
  return enabledWebappExportFormats(project).length > 0
}

export function isWebappExportFormatEnabled(
  project: ProjectExportCapabilities,
  format: WebappExportFormat,
): boolean {
  return enabledWebappExportFormats(project).includes(format)
}

export function isImageExportFormatEnabled(
  project: ProjectExportCapabilities,
  format: ImageExportSearchFormat,
): boolean {
  return isWebappExportFormatEnabled(project, format === 'jpeg' ? 'jpg' : format)
}
