import type { LayoutedView } from '@likec4/core'
import { LikeC4Diagram, pickViewBounds } from '@likec4/diagram'
import { Box } from '@likec4/styles/jsx'
import { LoadingOverlay } from '@mantine/core'
import { useSearch } from '@tanstack/react-router'
import { toBlob, toJpeg } from 'html-to-image'
import { useRef } from 'react'
import { useCurrentView, useTransparentBackground } from '../hooks'

function triggerDownload(url: string, filename: string) {
  const link = document.createElement('a')
  link.setAttribute('download', filename)
  link.href = url
  document.body.appendChild(link)
  link.click()
  return new Promise<void>(resolve =>
    setTimeout(() => {
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      resolve()
    }, 1000)
  )
}

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

    const url = URL.createObjectURL(blob)
    await triggerDownload(url, `${pngFilename}.png`)
    window.close()
  } catch (err) {
    console.error(err)
    window.alert(`Failed to export to PNG, check the console for more details.`)
  }
}

async function downloadAsJpeg({
  filename,
  viewport,
  quality = 0.8,
}: {
  filename: string
  viewport: HTMLElement
  quality?: number
}) {
  try {
    const backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--mantine-color-body')
    const dataUrl = await toJpeg(viewport, {
      backgroundColor,
      quality,
      cacheBust: true,
      // 1x1 transparent GIF used as fallback when remote images fail to load
      imagePlaceholder: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
    })
    await triggerDownload(dataUrl, `${filename}.jpg`)
    window.close()
  } catch (err) {
    console.error(err)
    window.alert(`Failed to export to JPEG, check the console for more details.`)
  }
}

export function ExportPage() {
  const [diagram] = useCurrentView()
  const { format } = useSearch({ strict: false })
  const isJpeg = format === 'jpeg'

  useTransparentBackground(!isJpeg)

  if (!diagram) {
    return <div>Loading...</div>
  }

  return <GuardedExportPage diagram={diagram} isJpeg={isJpeg} />
}

function GuardedExportPage({ diagram, isJpeg }: { diagram: LayoutedView; isJpeg: boolean }) {
  const {
    padding = 20,
    download = false,
    quality,
    dynamic,
  } = useSearch({
    strict: false,
  })
  const viewportRef = useRef<HTMLDivElement>(null)
  const loadingOverlayRef = useRef<HTMLDivElement>(null)

  // to track if download has already occurred
  const downloadedRef = useRef(false)

  const bounds = pickViewBounds(diagram, dynamic)

  const downloadDiagram = () => {
    const viewport = viewportRef.current
    if (!download || !viewport || !diagram || downloadedRef.current) {
      return
    }
    const loadingOverlay = loadingOverlayRef.current
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none'
    }
    downloadedRef.current = true
    if (isJpeg) {
      void downloadAsJpeg({
        filename: diagram.id,
        viewport,
        quality: quality ?? 0.8,
      })
    } else {
      void downloadAsPng({
        pngFilename: diagram.id,
        viewport,
      })
    }
  }

  // @see https://github.com/likec4/likec4/issues/1857
  const extraPadding = 16
  const width = bounds.width + padding * 2 + extraPadding
  const height = bounds.height + padding * 2 + extraPadding

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
        background: isJpeg ? 'var(--mantine-color-body)' : 'transparent',
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
        background={isJpeg ? 'solid' : 'transparent'}
        reduceGraphics={false}
        dynamicViewVariant={dynamic}
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

          if (download) {
            window.setTimeout(downloadDiagram, 500)
          }
        }}
      />
    </Box>
  )
}
