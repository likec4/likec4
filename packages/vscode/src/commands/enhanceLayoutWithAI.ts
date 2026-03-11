import { enhanceLayoutWithAI } from '@likec4/layouts/ai'
import { toValue, useCommand } from 'reactive-vscode'
import * as vscode from 'vscode'
import { VscodeLmProvider } from '../ai/VscodeLmProvider'
import { commands } from '../meta'
import { useExtensionLogger } from '../useExtensionLogger'
import type { PreviewPanel, RpcClient } from './types'

export interface EnhanceLayoutWithAIDeps {
  sendTelemetry(commandId: string): void
  rpc: RpcClient
  preview: PreviewPanel
}

// const hintsCache = new LayoutHintsCache()

export function registerEnhanceLayoutWithAICommand({ sendTelemetry, rpc, preview }: EnhanceLayoutWithAIDeps) {
  const { logger, output } = useExtensionLogger()

  useCommand(commands.enhanceLayoutWithAi, async () => {
    sendTelemetry(commands.enhanceLayoutWithAi)

    const viewId = toValue(preview.viewId)
    const projectId = toValue(preview.projectId)
    if (!viewId || !projectId) {
      await vscode.window.showInformationMessage(
        'Open a preview to enhance its layout with AI.',
      )
      return
    }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Enhancing layout with AI...',
        cancellable: true,
      },
      async (_progress, token) => {
        try {
          // Fetch the computed model to get the view
          const modelResult = await rpc.fetchComputedModel(projectId)
          if (!modelResult?.model) {
            vscode.window.showWarningMessage('Failed to fetch model data.')
            return
          }

          const computedView = modelResult.model.views[viewId]
          if (!computedView) {
            vscode.window.showWarningMessage(`View "${viewId}" not found in model.`)
            return
          }

          // // Check cache first
          // let hints = hintsCache.get(computedView)
          // if (!hints) {
          const provider = new VscodeLmProvider(output)
          const abortController = new AbortController()
          token.onCancellationRequested(() => abortController.abort())

          const hints = await enhanceLayoutWithAI(
            computedView,
            provider,
            abortController.signal,
          )

          if (token.isCancellationRequested) return

          if (!hints) {
            vscode.window.showWarningMessage(
              'AI could not generate layout suggestions for this view.',
            )
            return
          }
          //   hints = result
          //   hintsCache.set(computedView, hints)
          // }

          // Re-layout the view with AI hints
          const result = await rpc.layoutView({ viewId, projectId, hints })

          if (result) {
            const { reasoning, ..._hints } = hints
            output.info(`AI layout enhancement\n${reasoning}`)
            output.info(`Applied layout hints:\n${JSON.stringify(_hints, null, 2)}`)

            vscode.window.showInformationMessage('AI-enhanced layout applied!', { modal: false })
            await rpc.changeView({
              viewId,
              projectId,
              change: {
                op: 'save-view-snapshot',
                layout: result.diagram,
              },
            })
          } else {
            vscode.window.showWarningMessage('Failed to apply AI-enhanced layout.')
          }
        } catch (error) {
          if (error instanceof Error && error.message.includes('No language model')) {
            vscode.window.showErrorMessage(
              'No AI language model available. Install GitHub Copilot or configure an LM provider.',
            )
          } else {
            logger.error('AI layout enhancement failed', { error })
            vscode.window.showErrorMessage('AI layout enhancement failed. Check the output for details.')
          }
        }
      },
    )
  })
}
