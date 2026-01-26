import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import z from 'zod/v4'
import { ExportPage } from '../../pages/ExportPage'

export const Route = createFileRoute('/project/$projectId/export/$viewId')({
  validateSearch: z.object({
    download: z.boolean().optional().catch(false),
  }),
  search: {
    middlewares: [
      stripSearchParams({
        download: false,
      }),
    ],
  },
  component: ExportPage,
})
