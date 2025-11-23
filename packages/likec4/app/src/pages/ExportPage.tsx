import { LikeC4Diagram, pickViewBounds } from '@likec4/diagram'
import { Box } from '@likec4/styles/jsx'
import { LoadingOverlay } from '@mantine/core'
import { useDebouncedCallback } from '@react-hookz/web'
import { useSearch } from '@tanstack/react-router'
import { toBlob } from 'html-to-image'
import { useRef } from 'react'
import { useCurrentView, useTransparentBackground } from '../hooks'

async function downloadAsPng({
  pngFilename,
  viewport,
}: {
  pngFilename: string
  viewport: HTMLElement
}) {
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
    dynamic,
  } = useSearch({
    strict: false,
  })
  const [diagram] = useCurrentView()
  const viewportRef = useRef<HTMLDivElement>(null)
  const loadingOverlayRef = useRef<HTMLDivElement>(null)

  // to track if download has already occurred
  const downloadedRef = useRef(false)

  useTransparentBackground()

  const downloadDiagram = useDebouncedCallback(
    () => {
      const viewport = viewportRef.current
      if (!download || !viewport || !diagram || downloadedRef.current) {
        return
      }
      const loadingOverlay = loadingOverlayRef.current
      if (loadingOverlay) {
        loadingOverlay.style.display = 'none'
      }
      downloadedRef.current = true
      void downloadAsPng({
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

  const bounds = pickViewBounds(diagram, dynamic)

  // @see https://github.com/likec4/likec4/issues/1857
  const extraPadding = 16
  const width = bounds.width + padding * 2 + extraPadding,
    height = bounds.height + padding * 2 + extraPadding

  return (
    <Box
      ref={viewportRef}
      data-testid="export-page"
      css={{
        position: 'fixed',
        top: '0',
        left: '0',
        padding: '0',
        margin: '0',
        background: 'transparent',
        overflow: 'hidden',
        zIndex: 2,
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
      <LikeC4Diagram
        view={diagram}
        fitView={false}
        fitViewPadding={{
          top: '0px',
          bottom: '0px',
          left: '0px',
          right: '0px',
        }}
        background={'transparent'}
        reduceGraphics={false}
        dynamicViewVariant={dynamic}
        // {...(dynamic !== 'sequence' && {
        //   initialWidth: width,
        //   initialHeight: height,
        // })}
        readonly
        className={'likec4-static-view'}
        pannable={false}
        zoomable={false}
        controls={false}
        enableNotations={false}
        enableElementDetails={false}
        enableRelationshipDetails={false}
        enableRelationshipBrowser={false}
        enableDynamicViewWalkthrough={false}
        enableFocusMode={false}
        enableSearch={false}
        nodesSelectable={false}
        nodesDraggable={false}
        enableElementTags={false}
        onInitialized={() => {
          if (!viewportRef.current) {
            console.error('viewportRef.current is null')
            return
          }
          const x = Math.round(-bounds.x + padding)
          const y = Math.round(-bounds.y + padding)

          const viewports = [...viewportRef.current.querySelectorAll<HTMLDivElement>('.react-flow__viewport')]
          viewports.forEach((el) => {
            el.style.transform = 'translate(' + x + 'px, ' + y + 'px)'
          })
          download && downloadDiagram()
        }}
      />
    </Box>
  )
}
