import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { lazy } from 'react'
import { z } from 'zod'

const ExportPageComponent = lazy(async () => {
  const { ExportPage } = await import('../../pages/ExportPage')
  return {
    default: ExportPage,
  }
})

export const Route = createFileRoute('/_single/export/$viewId')({
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
  component: ExportPageComponent,
  wrapInSuspense: true,
})
