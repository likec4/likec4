import useDocumentSelector from '#useDocumentSelector'
import useLanguageClient from '#useLanguageClient'
import type { ProjectId, ViewId } from '@likec4/core'
import type { Locate } from '@likec4/language-server/protocol'
import {
  executeCommand,
  nextTick,
  shallowRef,
  toValue,
  tryOnScopeDispose,
  useActiveTextEditor,
  useCommand,
  useDisposable,
  useVisibleTextEditors,
  watch,
} from 'reactive-vscode'
import { countBy, entries, groupBy, keys, map, pipe, prop } from 'remeda'
import * as vscode from 'vscode'
import {
  type DiagnosticSeverity as lcDiagnosticSeverity,
  State,
} from 'vscode-languageclient'
import { useBuiltinFileSystem } from './common/useBuiltinFileSystem'
import { useDiagramPanel, ViewType } from './common/useDiagramPanel'
import { useExtensionLogger } from './common/useExtensionLogger'
import { useIsActivated, whenExtensionActive } from './common/useIsActivated'
import { activateMessenger, useMessenger } from './common/useMessenger'
import { useTelemetry } from './common/useTelemetry'
import { languageId } from './const'
import { logError, logger, loggerOutput, logWarn } from './logger'
import { commands } from './meta'
import { useRpc } from './Rpc'
import { performanceMark } from './utils'

export function activateExtension(extensionKind: 'node' | 'web') {
  const m = performanceMark()
  useBuiltinFileSystem()
  useExtensionLogger()
  logger.debug(`activateExtension: ${extensionKind}`)
  const activeTextEditor = useActiveTextEditor()
  const visibleTextEditors = useVisibleTextEditors()
  const telemetry = useTelemetry()

  let activated = false
  function activate() {
    if (activated) {
      logger.debug(`language client already activated`)
      return
    }
    try {
      activateLc()
    } catch (e) {
      logError(e)
    } finally {
      activated = true
    }
  }

  createWebviewPanelSerializer(() => {
    if (!activated) {
      logger.debug('activate language client because of deserializing webview panel')
      activate()
    }
  })

  const { stop } = watch(activeTextEditor, () => {
    const textEditor = visibleTextEditors.value.find(editor => editor.document.languageId === languageId)
    if (!textEditor) return
    if (!activated) {
      logger.debug(`activate language client because of visible editor: ${textEditor.document.uri.toString()}`)
      activate()
    }
    nextTick(() => {
      stop()
    })
  }, {
    immediate: true,
  })

  logger.debug(`activateExtension done in ${m.pretty}`)
  telemetry.sendTelemetryEvent('activation', { extensionKind })
}

function stateName(state: State) {
  switch (state) {
    case State.Stopped:
      return 'Stopped'
    case State.Starting:
      return 'Starting'
    case State.Running:
      return 'Running'
  }
}

function activateLc() {
  const isActivated = useIsActivated()
  const client = useLanguageClient()
  const rpc = useRpc()
  const messenger = useMessenger()
  const preview = useDiagramPanel()
  activateMessenger({ rpc, preview, messenger })

  client.start()
    .then(() => {
      logger.info('language server started')
      isActivated.value = true
    })
    .catch(error => {
      logger.error('Failed to start language server', { error })
    })

  const telemetry = useTelemetry()
  logger.info('starting language server')

  const documentSelector = useDocumentSelector()

  function sendTelemetryAboutCommand(command: string) {
    telemetry.sendTelemetryEvent('command', { command })
  }

  useDisposable(client.onTelemetry((event) => {
    try {
      const { eventName, ...properties } = event
      logger.debug(`onTelemetry: ${eventName}`, { event })
      if (eventName === 'error') {
        if ('stack' in properties) {
          properties.stack = new vscode.TelemetryTrustedValue(properties.stack)
        }
        telemetry.sendTelemetryErrorEvent('error', properties)
        return
      }
      telemetry.sendTelemetryEvent(eventName, properties)
    } catch (e) {
      logWarn(e)
    }
  }))

  useDisposable(client.onDidChangeState((event) => {
    logger.debug(`onDidChangeState: ${stateName(event.oldState)} -> ${stateName(event.newState)}`)
  }))

  async function restartServer() {
    logger.info('restarting language server')
    if (client.isRunning()) {
      logger.info('stopping language server')
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

  // const preview = useDiagramPreview()
  useCommand(commands.restart, () => {
    sendTelemetryAboutCommand(commands.restart)
    restartServer()
  })
  useCommand(commands.openPreview, async (viewId?: ViewId, projectId = 'default' as ProjectId) => {
    sendTelemetryAboutCommand(commands.openPreview)
    if (!viewId) {
      try {
        logger.debug('fetching views from all projects')
        const views = await rpc.fetchViewsFromAllProjects()
        if (views.length === 0) {
          await vscode.window.showWarningMessage('No views found', { modal: true })
          return
        }
        const isSingleProject = keys(countBy(views, (v) => v.projectId)).length === 1
        const items = views.map((v) => ({
          label: isSingleProject ? v.id : `${v.projectId}: ${v.id}`,
          description: v.title ?? '',
          viewId: v.id,
          projectId: v.projectId,
        }))
        const selected = await vscode.window.showQuickPick(items, {
          canPickMany: false,
          title: 'Select a view',
        })
        if (!selected) {
          return
        }
        viewId = selected.viewId
        projectId = selected.projectId
      } catch (e) {
        logWarn(e)
        return
      }
    }
    preview.open(viewId, projectId)
  })

  useCommand(commands.locate, async (params: Locate.Params) => {
    sendTelemetryAboutCommand(commands.locate)
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
    sendTelemetryAboutCommand(commands.previewContextOpenSource)
    const { element, deployment } = await preview.getLastClickedElement()
    if (deployment) {
      executeCommand(commands.locate, { deployment })
    } else if (element) {
      executeCommand(commands.locate, { element })
    }
  })

  useCommand(commands.printDotOfCurrentview, async () => {
    sendTelemetryAboutCommand(commands.printDotOfCurrentview)
    const viewId = toValue(preview.viewId)
    const projectId = toValue(preview.projectId)
    if (!viewId || !projectId) {
      logger.warn(`No preview panel found`)
      return
    }
    const result = await rpc.layoutView({ viewId, projectId })
    if (!result) {
      logger.warn(`Failed to layout view ${viewId}`)
      return
    }
    loggerOutput.info(`DOT of view "${viewId}"`)
    loggerOutput.info('\n' + result.dot)
    loggerOutput.show()
  })

  const layoutDiagnosticsCollection = vscode.languages.createDiagnosticCollection(
    'likec4:layout',
  )
  useDisposable(layoutDiagnosticsCollection)

  useCommand(commands.validateLayout, async () => {
    sendTelemetryAboutCommand(commands.validateLayout)
    const { result } = await rpc.validateLayout()

    if (!result) {
      logger.error('Failed to layout views')
      loggerOutput.show()
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

function createWebviewPanelSerializer(onActivate: () => void) {
  const deserializeState = shallowRef<any>(null)
  const deserializePanel = shallowRef<vscode.WebviewPanel | null>(null)

  whenExtensionActive(() => {
    const preview = useDiagramPanel()
    const { stop } = watch([deserializePanel, deserializeState], ([panel, state]) => {
      if (!panel || !state) return
      preview.deserialize(panel, state)
      nextTick(() => {
        stop()
      })
    }, {
      immediate: true,
    })
  })

  tryOnScopeDispose(() => {
    deserializeState.value = null
    deserializePanel.value = null
  })

  return useDisposable(vscode.window.registerWebviewPanelSerializer(
    ViewType,
    new class {
      async deserializeWebviewPanel(
        panel: vscode.WebviewPanel,
        state: any,
      ) {
        deserializeState.value = state
        deserializePanel.value = panel
        onActivate()
      }
    }(),
  ))
}
