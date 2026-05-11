// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { z } from 'zod'
import { ExportPage } from '../../pages/ExportPage'

export const Route = createFileRoute('/project/$projectId/export/$viewId')({
  validateSearch: z.object({
    download: z.boolean().optional().catch(false),
    format: z.enum(['png', 'jpeg']).optional().catch('png'),
    notation: z.boolean().optional().catch(false),
    quality: z.number().min(0).max(1).optional().catch(undefined),
  }),
  search: {
    middlewares: [
      stripSearchParams({
        download: false,
        format: 'png',
        notation: false,
        quality: undefined,
      }),
    ],
  },
  component: ExportPage,
})
