// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { exportPageSearchDefaults, exportPageSearchSchema } from '../../pages/export-page-params'
import { ExportPage } from '../../pages/ExportPage'

export const Route = createFileRoute('/project/$projectId/export/$viewId')({
  validateSearch: exportPageSearchSchema,
  search: {
    middlewares: [
      stripSearchParams(exportPageSearchDefaults),
    ],
  },
  component: ExportPage,
})
