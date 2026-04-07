import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import * as z from 'zod/v4'
import { ExportPage } from '../../pages/ExportPage'

export const Route = createFileRoute('/project/$projectId/export/$viewId')({
  validateSearch: z.object({
    download: z.boolean().optional().catch(false),
    format: z.enum(['png', 'jpeg']).optional().catch('png'),
    quality: z.number().min(0).max(1).optional().catch(undefined),
  }),
  search: {
    middlewares: [
      stripSearchParams({
        download: false,
        format: 'png',
        quality: undefined,
      }),
    ],
  },
  component: ExportPage,
})
