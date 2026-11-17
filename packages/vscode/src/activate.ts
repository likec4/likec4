import useTelemetry from '#useTelemetry'
import { onDeactivate, useDisposable, watch } from 'reactive-vscode'
import * as vscode from 'vscode'
import { registerCommands } from './commands'
import { globPattern, languageId } from './const'
import { useMarkdownPreview } from './markdown'
import {
  activateMessenger,
  createWebviewPanelSerializer,
  useDiagramPanel,
  ViewType,
} from './panel'
import { registerBuiltinFileSystem } from './registerBuiltinFileSystem'
import { useExtensionLogger } from './useExtensionLogger'
import { whenExtensionActive } from './useIsActivated'
import { useLanguageClient } from './useLanguageClient'
import { useRpc } from './useRpc'
import { isLikeC4Source, performanceMark } from './utils'

function hasOpenLikeC4Tab(): boolean {
  for (const group of vscode.window.tabGroups.all) {
    for (const tab of group.tabs) {
      const input = tab.input
      if (
        input
        && typeof input === 'object'
        && 'viewType' in input
        && typeof input.viewType === 'string'
        && input.viewType.includes(ViewType)
      ) {
        return true
      }
    }
  }
  return false
}

export function activateExtension(extensionKind: 'node' | 'web') {
  const m = performanceMark()
  const { logger, output } = useExtensionLogger()
  logger.info(`activateExtension: ${extensionKind}`)

  registerBuiltinFileSystem()
  const { client, startLanguageServer } = useLanguageClient()
  const rpc = useRpc()
  const preview = useDiagramPanel()
  const markdownPreview = useMarkdownPreview()

  let languageServerRequested = false
  function ensureLanguageServer(reason: string) {
    markdownPreview.setWorkspaceHasSources(true)
    if (languageServerRequested || client.isRunning()) {
      return
    }
    languageServerRequested = true
    logger.debug`starting language server (${reason})`
    startLanguageServer()
  }

  createWebviewPanelSerializer()

  activateMessenger()

  registerCommands()

  const hasOpenLikeC4Document = vscode.workspace.textDocuments.some(
    (doc) => doc.languageId === languageId || isLikeC4Source(doc.uri.path),
  )

  if (hasOpenLikeC4Document || hasOpenLikeC4Tab() || preview.visible.value) {
    ensureLanguageServer('active LikeC4 document or preview panel')
  } else {
    void vscode.workspace.findFiles(globPattern, undefined, 1).then(
      (files) => {
        if (files.length > 0) {
          ensureLanguageServer('workspace sources found')
        } else if (!languageServerRequested) {
          markdownPreview.setWorkspaceHasSources(false)
        }
      },
      (err) => {
        logger.debug('Failed to scan workspace for LikeC4 files', { error: err })
      },
    )
  }

  watch(preview.visible, (visible) => {
    if (visible) {
      ensureLanguageServer('diagram panel opened')
    }
  })

  useDisposable(
    vscode.workspace.onDidOpenTextDocument((doc) => {
      if (doc.languageId === languageId || isLikeC4Source(doc.uri.path)) {
        ensureLanguageServer('LikeC4 document opened')
      }
    }),
  )

  const watcher = useDisposable(vscode.workspace.createFileSystemWatcher(globPattern))
  useDisposable(watcher.onDidCreate(() => {
    ensureLanguageServer('LikeC4 source file created')
  }))

  rpc.onRequestOpenView(({ viewId, projectId }) => {
    logger.debug`rpc request open view ${viewId} of project ${projectId}`
    preview.open({
      viewId,
      projectId,
    })
  })

  whenExtensionActive(() => {
    logger.info(`activateExtension done in ${m.pretty}`)
    useTelemetry()
      .sendTelemetry('activation', { extensionKind })
  })

  onDeactivate(() => {
    output.info('deactivate extension')
  })

  return {
    rpc,
    preview,
    client,
    ensureLanguageServer,
    extendMarkdownIt: markdownPreview.extendMarkdownIt,
  }
}
