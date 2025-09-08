import { StaticLikeC4Diagram } from '@likec4/diagram'
import { Box } from '@likec4/styles/jsx'
import { LoadingOverlay } from '@mantine/core'
import { useDebouncedEffect } from '@react-hookz/web'
import { useSearch } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { useCurrentDiagram, useTransparentBackground } from '../hooks'

async function downloadAsPng({
  pngFilename,
  viewport,
}: {
  pngFilename: string
  viewport: HTMLElement
}) {
  const { toBlob } = await import('html-to-image')
  try {
    const blob = await toBlob(viewport, {
      backgroundColor: 'transparent',
      cacheBust: true,
      imagePlaceholder: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
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

export function ExportPage() {
  const {
    padding = 20,
    download = false,
  } = useSearch({
    strict: false,
  })
  const diagram = useCurrentDiagram()
  const viewportRef = useRef<HTMLDivElement>(null)
  const loadingOverlayRef = useRef<HTMLDivElement>(null)

  // to track if download has already occurred
  const downloadedRef = useRef(false)

  useTransparentBackground()

  useEffect(
    () => {
      if (!viewportRef.current) {
        return
      }
      const viewports = [...viewportRef.current.querySelectorAll<HTMLDivElement>('.react-flow__viewport')]
      viewports.forEach((el) => {
        el.style.transform = 'translate(' + padding + 'px, ' + padding + 'px)'
      })
    },
  )

  useDebouncedEffect(
    () => {
      const viewport = viewportRef.current
      if (!download || !viewport || !diagram) {
        return
      }
      const loadingOverlay = loadingOverlayRef.current
      if (loadingOverlay) {
        loadingOverlay.style.display = 'none'
      }
      if (downloadedRef.current) {
        return
      }
      downloadedRef.current = true
      downloadAsPng({
        pngFilename: diagram.id,
        viewport,
      })
    },
    [diagram],
    500,
  )

  if (!diagram) {
    return <div>Loading...</div>
  }

  // @see https://github.com/likec4/likec4/issues/1857
  const extraPadding = 16
  const width = diagram.bounds.width + padding * 2 + extraPadding,
    height = diagram.bounds.height + padding * 2 + extraPadding

  return (
    <Box
      ref={viewportRef}
      data-testid="export-page"
      css={{
        padding: '0',
        margin: '0',
        background: 'transparent',
        overflow: 'hidden',
      }}
      style={{
        marginRight: 'auto',
        marginBottom: 'auto',
        minWidth: width,
        width: width,
        minHeight: height,
        height: height,
      }}>
      {download && <LoadingOverlay ref={loadingOverlayRef} visible />}
      <StaticLikeC4Diagram
        view={diagram}
        fitView={false}
        fitViewPadding={0}
        background={'transparent'}
        reduceGraphics={false}
        initialWidth={diagram.bounds.width}
        initialHeight={diagram.bounds.height} />
    </Box>
  )
}
