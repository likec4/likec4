import { LikeC4Diagram } from '@likec4/diagram'
import { Box } from '@mantine/core'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useLikeC4View } from 'virtual:likec4/store'
import { RenderIcon } from '../components/RenderIcon'
import { useTransparentBackground } from '../useTransparentBackground'
import * as css from './view.css'

export const Route = createFileRoute('/export/$viewId')({
  component: ExportPage
})

function ExportPage() {
  const { padding = 20 } = Route.useSearch()
  const { viewId } = Route.useParams()
  const diagram = useLikeC4View(viewId)

  useTransparentBackground()

  useEffect(() => {
    document.querySelectorAll<HTMLDivElement>('.react-flow__viewport').forEach((el) => {
      el.style.transform = ''
    })
  })

  if (!diagram) {
    throw notFound()
  }

  return (
    <Box
      className={css.cssExportView}
      role="presentation"
      style={{
        minWidth: diagram.width + padding * 2,
        width: diagram.width + padding * 2,
        minHeight: diagram.height + padding * 2,
        height: diagram.height + padding * 2,
        padding
      }}>
      <Box
        className={css.cssExportBox}
        style={{
          width: diagram.width,
          minWidth: diagram.width,
          height: diagram.height,
          minHeight: diagram.height
        }}>
        <LikeC4Diagram
          view={diagram}
          readonly
          fitView={false}
          fitViewPadding={0}
          pannable={false}
          zoomable={false}
          controls={false}
          background={'transparent'}
          enableDynamicViewWalkthrough={false}
          showElementLinks={false}
          showDiagramTitle={false}
          nodesSelectable={false}
          nodesDraggable={false}
          renderIcon={RenderIcon}
          initialWidth={diagram.width}
          initialHeight={diagram.height} />
      </Box>
    </Box>
  )
}
