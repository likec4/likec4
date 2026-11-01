// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { z } from 'zod'
import { ErrorComponent } from '../../components/ErrorComponent'
import {
  DEFAULT_EXPORT_NOTATION_POSITION,
  DEFAULT_EXPORT_NOTATION_TEXT,
  ExportNotationPositions,
  ExportNotationTexts,
} from '../../pages/export-layout'
import { ExportPage } from '../../pages/ExportPage'

export const Route = createFileRoute('/project/$projectId/export/$viewId')({
  validateSearch: z.object({
    description: z.boolean().optional().catch(false),
    download: z.boolean().optional().catch(false),
    format: z.enum(['png', 'jpeg']).optional().catch('png'),
    notation: z.boolean().optional().catch(false),
    notationPosition: z.enum(ExportNotationPositions).optional().catch(DEFAULT_EXPORT_NOTATION_POSITION),
    notationText: z.enum(ExportNotationTexts).optional().catch(DEFAULT_EXPORT_NOTATION_TEXT),
    quality: z.number().min(0).max(1).optional().catch(undefined),
  }),
  search: {
    middlewares: [
      stripSearchParams({
        description: false,
        download: false,
        format: 'png',
        notation: false,
        notationPosition: DEFAULT_EXPORT_NOTATION_POSITION,
        notationText: DEFAULT_EXPORT_NOTATION_TEXT,
        quality: undefined,
      }),
    ],
  },
  component: ExportPage,
  errorComponent: ErrorComponent,
})
