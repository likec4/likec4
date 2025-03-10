import { createFileRoute } from '@tanstack/react-router'
import { ExportPage } from '../../pages/ExportPage'

const asBoolean = (v: unknown): boolean | undefined => {
  if (typeof v === 'boolean') {
    return v
  }
  if (typeof v === 'string') {
    return v === 'true'
  }
  return undefined
}

export const Route = createFileRoute('/project/$projectId/export/$viewId')({
  component: ExportPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      download: asBoolean(search.download),
    }
  },
})
