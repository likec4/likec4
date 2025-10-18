import { useCommand, useDisposable } from 'reactive-vscode'
import { entries, groupBy, map, pipe, prop } from 'remeda'
import * as vscode from 'vscode'
import type { DiagnosticSeverity as lcDiagnosticSeverity } from 'vscode-languageclient'
import { useExtensionLogger } from '../common/useExtensionLogger'
import { logger } from '../logger'
import { commands } from '../meta'
import type { RpcClient } from './types'

export interface ValidateLayoutCommandDeps {
  sendTelemetry(commandId: string): void
  rpc: RpcClient
}

export function registerValidateLayoutCommand({
  sendTelemetry,
  rpc,
}: ValidateLayoutCommandDeps) {
  const layoutDiagnosticsCollection = useDisposable(vscode.languages.createDiagnosticCollection(
    'likec4:layout',
  ))
  const { loggerOutput } = useExtensionLogger()

  useCommand(commands.validateLayout, async () => {
    sendTelemetry(commands.validateLayout)
    const { result } = await rpc.validateLayout()

    if (!result) {
      logger.error('Failed to validate layout - no result returned')
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
