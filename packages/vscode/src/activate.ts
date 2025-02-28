import useDocumentSelector from '#useDocumentSelector'
import type { ViewId } from '@likec4/core'
import type { LocateParams } from '@likec4/language-server/protocol'
import {
  executeCommand,
  nextTick,
  toValue,
  useActiveTextEditor,
  useCommand,
  useDisposable,
  useOutputChannel,
  useVisibleTextEditors,
  useVscodeContext,
  watch,
} from 'reactive-vscode'
import { entries, groupBy, map, pipe, prop, values } from 'remeda'
import * as vscode from 'vscode'
import {
  type BaseLanguageClient,
  type DiagnosticSeverity as lcDiagnosticSeverity,
  type LanguageClientOptions,
  type TextDocumentFilter,
} from 'vscode-languageclient'
import { isLikeC4Source } from './common/initWorkspace'
import { useBuiltinFileSystem } from './common/useBuiltinFileSystem'
import { useDiagramPreview, ViewType } from './common/useDiagramPreview'
import { useExtensionLogger } from './common/useExtensionLogger'
import { activateMessenger } from './common/useMessenger'
import { activateTelemetry } from './common/useTelemetry'
import { languageId } from './const'
import { logger, logWarn } from './logger'
import { commands } from './meta'
import { useRpc } from './Rpc'

let client: BaseLanguageClient

type CreateLanguageClient = (
  id: string,
  name: string,
  props: Omit<LanguageClientOptions, 'documentSelector' | 'outputChannel'> & {
    documentSelector: TextDocumentFilter[]
    outputChannel: vscode.OutputChannel
  },
) => BaseLanguageClient

export function activateLanguageClient(
  createLc: CreateLanguageClient,
  onActivated?: (output: ReturnType<typeof activateLc>) => void,
) {
  logger.debug('activateLanguageClient')
  const activeTextEditor = useActiveTextEditor()
  const visibleTextEditors = useVisibleTextEditors()
  const preview = useDiagramPreview()

  let activated = false
  function activate() {
    if (activated) return
    activated = true
    const result = activateLc(createLc)
    onActivated?.(result)
  }

  useDisposable(vscode.window.registerWebviewPanelSerializer(
    ViewType,
    new class {
      async deserializeWebviewPanel(
        panel: vscode.WebviewPanel,
        state: any,
      ) {
        activate()
        logger.debug('deserializeWebviewPanel\n{state}', { state })
        preview.deserialize(panel, state)
      }
    }(),
  ))

  const { stop } = watch(activeTextEditor, () => {
    if (visibleTextEditors.value.some(editor => editor.document.languageId === languageId)) {
      activate()
      nextTick(() => {
        stop()
      })
    }
  }, {
    immediate: true,
  })
}

function activateLc(
  createLc: CreateLanguageClient,
) {
  useBuiltinFileSystem()
  useVscodeContext('likec4.activated', true)
  const output = useExtensionLogger()
  logger.info('starting language server')
  const documentSelector = useDocumentSelector()

  client = createLc(
    'likec4',
    'LikeC4 Language Server',
    {
      documentSelector: toValue(documentSelector),
      outputChannel: useOutputChannel('LikeC4 Language Server', 'log'),
      diagnosticCollectionName: 'likec4',
      markdown: {
        isTrusted: true,
        supportHtml: true,
      },
      diagnosticPullOptions: {
        onTabs: true,
        match(_, resource) {
          return isLikeC4Source(resource.path)
        },
      },
    },
  )
  useDisposable(client)
  const rpc = useRpc(client)

  async function restartServer() {
    if (client.isRunning()) {
      logger.info('restarting language server')
      await client.stop()
    }
    client.outputChannel.clear()
    await client.start()
    logger.info('language server restarted')
  }

  watch(documentSelector, async () => {
    client.clientOptions.documentSelector = toValue(documentSelector)
    await restartServer()
  })

  const preview = useDiagramPreview()
  useCommand(commands.restart, restartServer)
  useCommand(commands.openPreview, async (viewId?: ViewId) => {
    if (!viewId) {
      try {
        const { model } = await rpc.fetchComputedModel()
        const views = values(model?.views ?? {}).map(v => ({
          label: v.id,
          description: v.title ?? '',
          viewId: v.id,
        })).sort((a, b) => {
          if (a.label === 'index') {
            return -1
          }
          if (b.label === 'index') {
            return 1
          }
          return a.label.localeCompare(b.label)
        })
        if (views.length === 0) {
          await vscode.window.showWarningMessage('No views found', { modal: true })
          return
        }
        const selected = await vscode.window.showQuickPick(views, {
          canPickMany: false,
          title: 'Select a view',
        })
        if (!selected) {
          return
        }

        viewId = selected.viewId
      } catch (e) {
        logWarn(e)
        return
      }
    }
    preview.open(viewId)
    telemetry.sendTelemetryErrorEvent('open-preview')
  })

  useCommand(commands.locate, async (params: LocateParams) => {
    const loc = await rpc.locate(params)
    if (!loc) return
    const location = rpc.client.protocol2CodeConverter.asLocation(loc)
    let viewColumn = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One
    // if (PreviewPanel.current?.panel.viewColumn === viewColumn) {
    //   viewColumn = vscode.ViewColumn.Beside
    // }
    const editor = await vscode.window.showTextDocument(location.uri, {
      viewColumn,
      selection: location.range,
      preserveFocus: viewColumn === vscode.ViewColumn.Beside,
    })
    editor.revealRange(location.range)
  })

  useCommand(commands.previewContextOpenSource, async () => {
    const { element, deployment } = await preview.getLastClickedElement()
    if (deployment) {
      executeCommand(commands.locate, { deployment })
    } else if (element) {
      executeCommand(commands.locate, { element })
    }
  })

  useCommand(commands.printDotOfCurrentview, async () => {
    const viewId = preview.viewId()
    if (!viewId) {
      logger.warn(`No preview panel found`)
      return
    }
    const result = await rpc.layoutView(viewId)
    if (!result) {
      logger.warn(`Failed to layout view ${viewId}`)
      return
    }
    output.info(`DOT of view "${viewId}":\n${result.dot}`)
    output.show()
  })

  activateMessenger(rpc)

  const layoutDiagnosticsCollection = vscode.languages.createDiagnosticCollection(
    'likec4:layout',
  )
  useDisposable(layoutDiagnosticsCollection)

  useCommand(commands.validateLayout, async () => {
    const { result } = await rpc.validateLayout()

    if (!result) {
      logger.warn('Failed to layout views')
      output.show(true)
      return
    }

    const diagnostic = pipe(
      result,
      groupBy(prop('uri')),
      entries(),
      map(([uri, messages]) => ([
        vscode.Uri.parse(uri),
        messages.map(m =>
          new vscode.Diagnostic(
            rpc.client.protocol2CodeConverter.asRange(m.range),
            m.message,
            convertSeverity(m.severity ?? 1),
          )
        ),
      ] satisfies [vscode.Uri, vscode.Diagnostic[]])),
    )
    layoutDiagnosticsCollection.clear()
    layoutDiagnosticsCollection.set(diagnostic)
  })

  const telemetry = activateTelemetry(rpc)

  logger.info('LikeC4 activated')

  return {
    rpc,
    client,
    preview,
  }
}

function convertSeverity(severity: lcDiagnosticSeverity): vscode.DiagnosticSeverity {
  switch (severity) {
    case 1:
      return vscode.DiagnosticSeverity.Error
    case 2:
      return vscode.DiagnosticSeverity.Warning
    case 3:
      return vscode.DiagnosticSeverity.Information
    case 4:
      return vscode.DiagnosticSeverity.Hint
  }
}
