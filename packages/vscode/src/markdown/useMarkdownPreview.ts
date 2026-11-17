import type MarkdownIt from 'markdown-it'
import { defineService, watch } from 'reactive-vscode'
import { config } from '../config.ts'
import { useExtensionLogger } from '../useExtensionLogger.ts'
import { likec4MarkdownIt } from './markdownItPlugin.ts'
import { useMarkdownModelCache } from './MarkdownModelCache.ts'

const DEFAULT_MAX_MODEL_BYTES = 5 * 1024 * 1024
const DEFAULT_MAX_HEIGHT = 500

export const useMarkdownPreview = defineService(() => {
  const { logger } = useExtensionLogger('markdown')
  const cache = useMarkdownModelCache()

  watch(
    () => config.markdownPreview.enabled,
    () => {
      cache.refreshAllPreviews('likec4.markdownPreview.enabled changed')
    },
  )

  function extendMarkdownIt(md: MarkdownIt): MarkdownIt {
    return likec4MarkdownIt(md, {
      enabled: () => config.markdownPreview.enabled !== false,
      maxModelBytes: () => DEFAULT_MAX_MODEL_BYTES,
      maxHeight: () => DEFAULT_MAX_HEIGHT,
      colorScheme: () => 'auto',
      panZoom: () => false,
      resolve: (docDir, explicit) => cache.resolve(docDir, explicit),
      snapshot: (project) => cache.getSnapshot(project),
      recordReferences: (docKey, projects) => cache.recordReferences(docKey, projects),
      markPendingDiscovery: (docKey) => cache.markPendingDiscovery(docKey),
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
