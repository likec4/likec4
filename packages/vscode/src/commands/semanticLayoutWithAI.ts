import { type AILayoutProvider, type AILayoutRequest, enhanceLayoutWithAI } from '@likec4/layouts/ai'
import { loggable } from '@likec4/log'
import { toValue, useCommand } from 'reactive-vscode'
import { ref } from 'reactive-vscode'
import { hasAtLeast, once } from 'remeda'
import vscode from 'vscode'
import { commands } from '../meta.ts'
import { useExtensionLogger } from '../useExtensionLogger.ts'
import { useMessenger } from '../useMessenger.ts'
import type { PreviewPanel, RpcClient } from './types'

export interface SemanticLayoutAICmdDeps {
  sendTelemetry(commandId: string): void
  rpc: RpcClient
  preview: PreviewPanel
}

const selectedModelId = ref<string | null>(null)

export function registerSemanticLayoutWithAICommand({ sendTelemetry, rpc, preview }: SemanticLayoutAICmdDeps) {
  const { logger, output } = useExtensionLogger()
  const messenger = useMessenger()

  useCommand(commands.semanticLayoutWithAi, async () => {
    sendTelemetry(commands.semanticLayoutWithAi)

    const viewId = toValue(preview.viewId)
    const projectId = toValue(preview.projectId)
    if (!viewId || !projectId) {
      await vscode.window.showInformationMessage(
        'Open a preview to enhance its layout with AI.',
      )
      return
    }

    messenger.broadcastAiLayoutUpdate({
      viewId,
      projectId,
      state: 'in-progress',
    })

    let completed = false
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Enhancing layout',
        cancellable: true,
      },
      async (progress, token) => {
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

          progress.report({ message: 'semantic analysis with AI...', increment: 20 })

          const hints = await enhanceLayoutWithAI(
            computedView,
            new VscodeAILayoutProvider(
              output,
              once(() => {
                progress.report({ message: 'receiving hints from AI...', increment: 40 })
              }),
            ),
            token,
          ).catch(err => {
            logger.warn(loggable(err))
            return null
          })

          if (!hints) {
            vscode.window.showWarningMessage(
              'AI could not generate layout suggestions for this view.',
            )
            return
          }
          if (token.isCancellationRequested) {
            logger.info('AI layout enhancement cancelled by user')
            return
          }

          progress.report({ message: 'applying layout hints...', increment: 20 })

          const { reasoning, ..._hints } = hints
          output.info(`Reasoning\n` + reasoning)
          output.info(`Layout hints\n` + JSON.stringify(_hints, null, 2))

          // Re-layout the view with AI hints
          const result = await rpc.layoutView({ viewId, projectId, hints }).catch(err => {
            logger.warn(loggable(err))
            return null
          })

          if (!result) {
            vscode.window.showWarningMessage('Failed to layout AI-enhanced layout.')
            return
          }

          const saved = await rpc.changeView({
            viewId,
            projectId,
            change: {
              op: 'save-view-snapshot',
              layout: result.diagram,
            },
          }).catch(err => {
            return {
              success: false as const,
              error: loggable(err),
            }
          })

          if (!saved.success) {
            logger.warn(saved.error)
            vscode.window.showWarningMessage('Failed to apply AI-enhanced layout.')
            return
          }

          completed = true
          vscode.window.showInformationMessage('AI-enhanced layout applied!', { modal: false })

          if (saved.location) {
            logger.info`Snapshot saved to ${saved.location.uri.toString()}`
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

    messenger.broadcastAiLayoutUpdate({
      viewId,
      projectId,
      state: completed ? 'completed' : 'failed',
    })
  })
}

function createOutputChannel() {
  const out = vscode.window.createOutputChannel('LikeC4 AI Layout')
  return {
    out,
    append: (value: string): void => {
      out.append(value)
    },
    appendLine: (value: string): void => {
      out.appendLine(value)
    },
    [Symbol.asyncDispose]: async () => {
      setTimeout(() => {
        out.dispose()
      }, 10000)
    },
  }
}

async function selectModel(output: vscode.OutputChannel): Promise<vscode.LanguageModelChat | null> {
  // if (selectedModelId.value) {
  //   const models = await vscode.lm.selectChatModels({
  //     id: selectedModelId.value,
  //   })
  //   if (hasAtLeast(models, 1)) {
  //     return models[0]
  //   }
  // }

  const models = await vscode.lm.selectChatModels()

  if (!hasAtLeast(models, 1)) {
    throw new Error(
      'No language models available. Please ensure GitHub Copilot or another LM provider is installed.',
    )
  }

  output.appendLine(`Available models:`)
  for (const model of models) {
    output.appendLine(`- ${model.family} (${model.vendor})`)
  }

  const selected = await vscode.window.showQuickPick(
    models.map((model) => ({
      label: model.family,
      picked: model.id === selectedModelId.value,
      description: model.vendor,
      model,
    })),
    {
      placeHolder: 'Choose a language model to use for AI layout',
      canPickMany: false,
      ignoreFocusOut: true,
    },
  )

  if (!selected) {
    selectedModelId.value = null
    return null
  }

  selectedModelId.value = selected.model.id
  return selected.model
}

/**
 * AI layout provider using VS Code Language Model API (e.g. GitHub Copilot).
 */
class VscodeAILayoutProvider implements AILayoutProvider<vscode.CancellationToken> {
  readonly name = 'VSCode Language Model'

  constructor(
    private readonly logger: vscode.LogOutputChannel,
    private readonly onStartRecevingFromModel: () => void,
  ) {
  }

  async sendRequest(
    request: AILayoutRequest,
    cancelToken: vscode.CancellationToken,
  ): Promise<string> {
    await using channel = createOutputChannel()
    channel.out.show()
    const model = await selectModel(channel.out)

    if (!model) {
      throw new Error(
        'No language model selected. Please ensure GitHub Copilot or another LM provider is installed.',
      )
    }

    channel.appendLine(`
PICKED MODEL:
  ${model.family} (vendor: ${model.vendor})
----------------------      
User prompt:
${request.userPrompt}
${request.diagram}
----------------------   
`)
    this.logger.info(`use model "${model.family}" for AI layout`)

    const messages = [
      vscode.LanguageModelChatMessage.Assistant(request.systemPrompt),
      vscode.LanguageModelChatMessage.User([
        new vscode.LanguageModelTextPart(request.userPrompt),
        new vscode.LanguageModelTextPart(request.diagram),
      ]),
    ]

    channel.appendLine(`sending request to model`)
    const response = await model.sendRequest(
      messages,
      {
        modelOptions: {
          effort: 'medium',
        },
        justification: 'LikeC4 needs AI assistance to optimize diagram layout',
      },
      cancelToken,
    )

    let text = ''
    for await (const chunk of response.text) {
      if (text === '') {
        channel.appendLine(`response`)
        channel.appendLine(`----------------------`)
        this.onStartRecevingFromModel()
      }
      channel.append(chunk)
      text += chunk
      if (cancelToken.isCancellationRequested) {
        channel.appendLine(`\nrequest cancelled, stopping response processing`)
        this.logger.warn('AI layout request cancelled by user')
        throw new vscode.CancellationError()
      }
    }

    this.logger.debug('received from model\n' + text)

    return text
  }
}
