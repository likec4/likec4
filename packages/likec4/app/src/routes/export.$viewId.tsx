import { LikeC4Diagram } from '@likec4/diagram'
import { Box, LoadingOverlay } from '@mantine/core'
import { useDebouncedEffect } from '@react-hookz/web'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { useLikeC4View } from 'virtual:likec4/store'
import { RenderIcon } from '../components/RenderIcon'
import { useTransparentBackground } from '../hooks'
import * as css from './view.css'

async function downloadAsPng({
  pngFilename,
  viewport
}: {
  pngFilename: string
  viewport: HTMLElement
}) {
  const { toBlob } = await import('html-to-image')
  const {
    width,
    height
  } = viewport.getBoundingClientRect()
  try {
    const blob = await toBlob(viewport, {
      backgroundColor: 'transparent',
      width,
      height,
      cacheBust: true,
      imagePlaceholder: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='
    })
    if (!blob) {
      throw new Error('Failed to create PNG blob')
    }

    // Create a temporary URL for the file
    var url = URL.createObjectURL(blob)

    // Create a new link element with the download attribute set to the desired filename
    var link = document.createElement('a')
    link.setAttribute('download', `${pngFilename}.png`)

    // Set the link's href attribute to the temporary URL
    link.href = url

    // Simulate a click on the link to trigger the download
    document.body.appendChild(link)
    link.click()

    await new Promise(resolve => setTimeout(resolve, 1000))

    // Clean up the temporary URL and link element
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    window.close()
  } catch (err) {
    console.error(err)
    window.alert(`Failed to export to PNG, check the console for more details.`)
  }
}

const asBoolean = (v: unknown): boolean | undefined => {
  if (typeof v === 'boolean') {
    return v
  }
  if (typeof v === 'string') {
    return v === 'true'
  }
  return undefined
}

export const Route = createFileRoute('/export/$viewId')({
  component: ExportPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      download: asBoolean(search.download)
    }
  }
})

function ExportPage() {
  const {
    padding = 20,
    download = false
  } = Route.useSearch()
  const { viewId } = Route.useParams()
  const diagram = useLikeC4View(viewId)
  const viewportRef = useRef<HTMLDivElement>(null)
  const loadingOverlayRef = useRef<HTMLDivElement>(null)

  useTransparentBackground()

  useEffect(() => {
    document.querySelectorAll<HTMLDivElement>('.react-flow__viewport').forEach((el) => {
      el.style.transform = ''
    })
  })

  useDebouncedEffect(
    () => {
      const viewport = viewportRef.current
      if (!download || !viewport || !diagram) {
        return
      }
      const loadingOverlay = loadingOverlayRef.current
      if (loadingOverlay) {
        loadingOverlay.style.display = 'none'
        return
      }
      downloadAsPng({
        pngFilename: viewId,
        viewport
      })
    },
    [],
    500
  )

  if (!diagram) {
    throw notFound()
  }

  const width = diagram.bounds.width + padding * 2,
    height = diagram.bounds.height + padding * 2

  return (
    <Box
      ref={viewportRef}
      className={css.cssExportView}
      role="presentation"
      style={{
        minWidth: width,
        width: width,
        minHeight: height,
        height: height
      }}>
      {download && <LoadingOverlay ref={loadingOverlayRef} visible />}
      <LikeC4Diagram
        view={diagram}
        readonly
        fitView={true}
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
        enableFocusMode={false}
        renderIcon={RenderIcon}
        initialWidth={width}
        initialHeight={height} />
    </Box>
  )
}
