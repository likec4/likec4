import { createFileRoute } from '@tanstack/react-router'
import { EmbedPage } from '../../pages/EmbedPage'

export const Route = createFileRoute('/_single/embed/$viewId')({
  component: EmbedPage,
})
