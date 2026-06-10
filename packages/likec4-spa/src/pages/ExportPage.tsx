// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { type LayoutedView, type NodeNotation, type RichTextOrEmpty, RichText } from '@likec4/core'
import { LikeC4Diagram, pickViewBounds, useLikeC4Styles } from '@likec4/diagram'
import { ElementShape, Markdown } from '@likec4/diagram/custom'
import { Box } from '@likec4/styles/jsx'
import { LoadingOverlay } from '@mantine/core'
import { useSearch } from '@tanstack/react-router'
import type { CSSProperties } from 'react'
import { useRef } from 'react'
import { useCurrentView, useTransparentBackground } from '../hooks'
import {
  computeExportPageLayout,
  EXPORT_DESCRIPTION_BODY_TOP_GAP,
  EXPORT_DESCRIPTION_BOTTOM_PADDING,
  EXPORT_DESCRIPTION_INSET,
  EXPORT_DESCRIPTION_TITLE_LINE_HEIGHT,
  EXPORT_DESCRIPTION_TOP_PADDING,
  EXPORT_NOTATION_ITEM_HEIGHT,
} from './export-layout'
import { hasSolidExportBackground, isExportSearchFlagEnabled, normalizeExportBackground } from './export-page-params'

type PaletteCssVars =
  & CSSProperties
  & Record<
    '--likec4-palette-fill' | '--likec4-palette-stroke' | '--likec4-palette-hiContrast' | '--likec4-palette-loContrast',
    string
  >

/**
 * Downloads a generated object URL or data URL through a temporary browser link.
 */
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

/**
 * Converts the export viewport into a PNG file and starts a browser download.
 */
async function downloadAsPng({
  background,
  pngFilename,
  viewport,
}: {
  background?: string | undefined
  pngFilename: string
  viewport: HTMLElement
}) {
  try {
    const { toBlob } = await import('html-to-image')
    const blob = await toBlob(viewport, {
      backgroundColor: background ?? 'transparent',
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

/**
 * Converts the export viewport into a JPEG file and starts a browser download.
 */
async function downloadAsJpeg({
  background,
  filename,
  viewport,
  quality = 0.8,
}: {
  background?: string | undefined
  filename: string
  viewport: HTMLElement
  quality?: number
}) {
  try {
    const { toJpeg } = await import('html-to-image')
    const backgroundColor = background ??
      getComputedStyle(document.documentElement).getPropertyValue('--mantine-color-body')
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

/**
 * Renders the single-view export page used by browser downloads and CLI screenshots.
 */
export function ExportPage() {
  const [diagram] = useCurrentView()
  const { background, format } = useSearch({ strict: false })
  const exportBackground = normalizeExportBackground(background)
  const isJpeg = format === 'jpeg'

  useTransparentBackground(!isJpeg)

  if (!diagram) {
    return <div>Loading...</div>
  }

  return <GuardedExportPage diagram={diagram} exportBackground={exportBackground} isJpeg={isJpeg} />
}

/**
 * Renders the measured export viewport for a loaded diagram.
 */
function GuardedExportPage({
  diagram,
  exportBackground,
  isJpeg,
}: {
  diagram: LayoutedView
  exportBackground: string | undefined
  isJpeg: boolean
}) {
  const {
    padding = 20,
    download = false,
    description = false,
    quality,
    dynamic,
    notation = false,
  } = useSearch({
    strict: false,
  })
  const viewportRef = useRef<HTMLDivElement>(null)
  const loadingOverlayRef = useRef<HTMLDivElement>(null)

  // to track if download has already occurred
  const downloadedRef = useRef(false)

  const bounds = pickViewBounds(diagram, dynamic)
  const viewDescription = RichText.from(diagram.description)
  const showDescription = isExportSearchFlagEnabled(description) && viewDescription.nonEmpty
  const viewTitle = diagram.title ?? diagram.id
  const notationEntries = diagram.notation?.nodes ?? []
  const showNotation = isExportSearchFlagEnabled(notation) && notationEntries.length > 0
  const layout = computeExportPageLayout({
    bounds,
    padding,
    description: showDescription ? { title: viewTitle, text: viewDescription.text } : null,
    notationEntries: showNotation ? notationEntries.length : 0,
  })
  const hasSolidBackground = isJpeg || hasSolidExportBackground(exportBackground)

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
        background: exportBackground,
        filename: diagram.id,
        viewport,
        quality: quality ?? 0.8,
      })
    } else {
      void downloadAsPng({
        background: exportBackground,
        pngFilename: diagram.id,
        viewport,
      })
    }
  }

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
        minWidth: layout.width,
        width: layout.width,
        minHeight: layout.height,
        height: layout.height,
        backgroundColor: exportBackground ?? (isJpeg ? 'var(--mantine-color-body)' : 'transparent'),
      }}>
      {download && <LoadingOverlay ref={loadingOverlayRef} visible />}
      <Box
        data-testid="export-diagram-area"
        css={{
          position: 'absolute',
          overflow: 'hidden',
        }}
        style={{
          top: layout.diagram.top,
          left: layout.diagram.left,
          width: layout.diagram.width,
          height: layout.height - layout.diagram.top,
        }}>
        <LikeC4Diagram
          view={diagram}
          fitView={false}
          fitViewPadding={{
            top: '0px',
            bottom: '0px',
            left: '0px',
            right: '0px',
          }}
          background={hasSolidBackground ? 'solid' : 'transparent'}
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
      {layout.description && (
        <ExportDescriptionPanel
          title={viewTitle}
          description={viewDescription}
          layout={layout.description}
        />
      )}
      {layout.notation && (
        <ExportNotationPanel
          entries={notationEntries}
          layout={layout.notation}
        />
      )}
    </Box>
  )
}

/**
 * Renders the optional Markdown description panel above the exported diagram.
 */
function ExportDescriptionPanel({
  title,
  description,
  layout,
}: Readonly<{
  title: string
  description: RichTextOrEmpty
  layout: NonNullable<ReturnType<typeof computeExportPageLayout>['description']>
}>) {
  const panelStyle: CSSProperties = {
    ...layout,
    position: 'absolute',
    boxSizing: 'border-box',
    overflow: 'hidden',
    border: '1px solid var(--mantine-color-default-border)',
    borderRadius: 6,
    background: 'var(--mantine-color-body)',
    boxShadow: '0 4px 18px rgb(0 0 0 / 14%)',
    color: 'var(--mantine-color-text)',
  }
  const titleStyle: CSSProperties = {
    paddingTop: EXPORT_DESCRIPTION_TOP_PADDING,
    paddingBottom: EXPORT_DESCRIPTION_BODY_TOP_GAP,
    paddingLeft: EXPORT_DESCRIPTION_INSET,
    paddingRight: EXPORT_DESCRIPTION_INSET,
    fontSize: 15,
    fontWeight: 600,
    lineHeight: `${EXPORT_DESCRIPTION_TITLE_LINE_HEIGHT}px`,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }
  const descriptionStyle: CSSProperties = {
    maxHeight: layout.height
      - EXPORT_DESCRIPTION_TOP_PADDING
      - EXPORT_DESCRIPTION_TITLE_LINE_HEIGHT
      - EXPORT_DESCRIPTION_BODY_TOP_GAP
      - EXPORT_DESCRIPTION_BOTTOM_PADDING,
    overflow: 'hidden',
    paddingLeft: EXPORT_DESCRIPTION_INSET,
    paddingRight: EXPORT_DESCRIPTION_INSET,
    paddingBottom: EXPORT_DESCRIPTION_BOTTOM_PADDING,
  }

  return (
    <Box
      data-testid="export-description"
      style={panelStyle}>
      <Box style={titleStyle}>{title}</Box>
      <Markdown
        value={description}
        hideIfEmpty
        fontSize="sm"
        textScale={0.9}
        style={descriptionStyle}
      />
    </Box>
  )
}

/**
 * Renders the optional notation panel next to the exported diagram.
 */
function ExportNotationPanel({
  entries,
  layout,
}: Readonly<{
  entries: readonly NodeNotation[]
  layout: NonNullable<ReturnType<typeof computeExportPageLayout>['notation']>
}>) {
  const panelStyle: CSSProperties = {
    ...layout,
    position: 'absolute',
    boxSizing: 'border-box',
    overflow: 'hidden',
    border: '1px solid var(--mantine-color-default-border)',
    borderRadius: 6,
    background: 'var(--mantine-color-body)',
    boxShadow: '0 4px 18px rgb(0 0 0 / 14%)',
    color: 'var(--mantine-color-text)',
  }
  const headerStyle: CSSProperties = {
    height: 36,
    display: 'flex',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 12,
    fontSize: 13,
    fontWeight: 600,
    borderBottom: '1px solid var(--mantine-color-default-border)',
  }

  return (
    <Box
      data-testid="export-notation"
      style={panelStyle}>
      <Box style={headerStyle}>Notation</Box>
      <Box
        style={{
          padding: 12,
        }}>
        {entries.map((entry, index) => <ExportNotationItem key={`${entry.title}-${index}`} entry={entry} />)}
      </Box>
    </Box>
  )
}

/**
 * Renders one notation entry with its representative element shape and labels.
 */
function ExportNotationItem({ entry }: Readonly<{ entry: NodeNotation }>) {
  const styles = useLikeC4Styles()
  const elementColors = styles.colors(entry.color).elements
  const colorVars: PaletteCssVars = {
    '--likec4-palette-fill': elementColors.fill,
    '--likec4-palette-stroke': elementColors.stroke,
    '--likec4-palette-hiContrast': elementColors.hiContrast,
    '--likec4-palette-loContrast': elementColors.loContrast,
  }
  const itemStyle: CSSProperties = {
    ...colorVars,
    display: 'grid',
    gridTemplateColumns: '64px 1fr',
    columnGap: 10,
    alignItems: 'center',
    height: EXPORT_NOTATION_ITEM_HEIGHT,
    overflow: 'hidden',
  }
  const kindsStyle: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 3,
    marginBottom: 5,
    maxHeight: 31,
    overflow: 'hidden',
  }
  const kindStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    height: 14,
    maxWidth: '100%',
    paddingLeft: 4,
    paddingRight: 4,
    borderRadius: 2,
    background: 'var(--likec4-palette-fill)',
    color: 'var(--likec4-palette-hiContrast)',
    fontSize: 9.5,
    fontWeight: 500,
    lineHeight: 1,
    textTransform: 'lowercase',
    whiteSpace: 'nowrap',
  }
  const titleStyle: CSSProperties = {
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2,
    fontSize: 13,
    fontWeight: 500,
    lineHeight: 1.2,
  }

  return (
    <Box
      data-likec4-color={entry.color}
      style={itemStyle}>
      <Box
        style={{
          position: 'relative',
          width: 56,
          height: 38,
        }}>
        <ElementShape
          data={{
            shape: entry.shape,
            width: 300,
            height: 200,
          }}
          showSelectionOutline={false}
        />
      </Box>
      <Box
        css={{
          minWidth: 0,
        }}>
        <Box
          style={kindsStyle}>
          {entry.kinds.map(kind => (
            <Box
              key={kind}
              as="span"
              style={kindStyle}>
              {kind}
            </Box>
          ))}
        </Box>
        <Box style={titleStyle}>{entry.title}</Box>
      </Box>
    </Box>
  )
}
