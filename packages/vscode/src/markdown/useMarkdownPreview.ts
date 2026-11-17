import type { CustomColorDefinitions } from '@likec4/core/styles'
import type MarkdownIt from 'markdown-it'
import { defineService, useDisposable, watch } from 'reactive-vscode'
import { config } from '../config.ts'
import { useExtensionLogger } from '../useExtensionLogger.ts'
import type { ColorScheme } from './fence.ts'
import { escapeHtml } from './html.ts'
import { likec4MarkdownIt } from './markdownItPlugin.ts'
import { useMarkdownModelCache } from './MarkdownModelCache.ts'
import { type StaticViewLike, ID_TOKEN, renderStaticSvg } from './staticSvg.ts'
import type { HostData, HostOptions, ProjectSnapshot } from './types.ts'

const MAX_SVG_CACHE_SIZE = 500
const DEFAULT_MAX_MODEL_BYTES = 2_097_152
const DEFAULT_MAX_HEIGHT = 600

export const useMarkdownPreview = defineService(() => {
  const { logger } = useExtensionLogger('markdown')
  const cache = useMarkdownModelCache()
  const svgCache = new Map<string, string>()

  useDisposable({
    dispose() {
      svgCache.clear()
    },
  })

  watch(
    [
      () => config.markdownPreview.enabled,
      () => config.markdownPreview.colorScheme,
      () => config.markdownPreview.maxHeight,
      () => config.markdownPreview.maxModelBytes,
      () => config.markdownPreview.panZoom,
    ],
    () => {
      cache.refreshAllPreviews('likec4.markdownPreview configuration changed')
    },
  )

  function maxModelBytes(): number {
    const raw = Number(config.markdownPreview.maxModelBytes)
    return Number.isFinite(raw) && raw >= 65536 ? Math.floor(raw) : DEFAULT_MAX_MODEL_BYTES
  }

  function maxHeight(): number {
    const raw = Number(config.markdownPreview.maxHeight)
    return Number.isFinite(raw) && raw >= 100 ? Math.floor(raw) : DEFAULT_MAX_HEIGHT
  }

  function colorScheme(): ColorScheme {
    const raw = config.markdownPreview.colorScheme
    if (raw === 'light' || raw === 'dark' || raw === 'auto') {
      return raw
    }
    return 'auto'
  }

  function staticSnapshot(
    snap: ProjectSnapshot,
    viewId: string,
    opts: HostOptions,
    hostId: string,
  ): string {
    const views = snap.data?.views as Record<string, StaticViewLike | undefined> | undefined
    const view = views?.[viewId]
    if (!view) {
      return ''
    }
    const key = `${view.hash ?? snap.hash}|${viewId}|${opts.variant}|${opts.maxHeight}`
    let svg = svgCache.get(key)
    if (svg === undefined) {
      try {
        const spec = snap.data?.specification as { customColors?: CustomColorDefinitions } | undefined
        svg = renderStaticSvg(view, opts.variant, opts.maxHeight, spec?.customColors)
      } catch {
        svg = ''
      }
      if (svgCache.size >= MAX_SVG_CACHE_SIZE) {
        const oldest = svgCache.keys().next().value
        if (oldest !== undefined) {
          svgCache.delete(oldest)
        }
      }
      svgCache.set(key, svg)
    }
    return svg.split(ID_TOKEN).join(hostId)
  }

  function renderHostBody(
    snap: ProjectSnapshot,
    viewId: string,
    opts: HostOptions,
    hostId: string,
    data: HostData,
  ): string {
    const staleNotice = data.state === 'stale'
      ? `<div class="likec4-notice likec4-notice-warning">Showing the last valid version. ${
        escapeHtml(data.message ?? '')
      }</div>`
      : ''
    const trimmedNotice = data.trimmed && opts.browser
      ? '<div class="likec4-notice likec4-notice-info">The LikeC4 model is too large to embed completely; navigation is disabled.</div>'
      : ''
    return staleNotice + trimmedNotice + staticSnapshot(snap, viewId, opts, hostId)
  }

  function extendMarkdownIt(md: MarkdownIt): MarkdownIt {
    return likec4MarkdownIt(md, {
      enabled: () => config.markdownPreview.enabled !== false,
      maxModelBytes,
      maxHeight,
      colorScheme,
      panZoom: () => Boolean(config.markdownPreview.panZoom),
      resolve: (docDir, explicit) => cache.resolve(docDir, explicit),
      snapshot: (project) => cache.getSnapshot(project),
      recordReferences: (docKey, projects) => cache.recordReferences(docKey, projects),
      markPendingDiscovery: (docKey) => cache.markPendingDiscovery(docKey),
      renderHostBody,
      onRendered: (docKey, blocks, ms) => {
        logger.debug`rendered ${blocks} likec4-view block(s) in ${ms.toFixed(1)}ms (${docKey ?? 'untitled'})`
      },
    })
  }

  return {
    extendMarkdownIt,
    setWorkspaceHasSources: cache.setWorkspaceHasSources,
  }
})
