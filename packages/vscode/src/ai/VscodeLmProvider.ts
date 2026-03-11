import type { AILayoutProvider, AILayoutRequest } from '@likec4/layouts/ai'
import * as vscode from 'vscode'

/**
 * AI layout provider using VS Code Language Model API (e.g. GitHub Copilot).
 */
export class VscodeLmProvider implements AILayoutProvider {
  readonly name = 'VS Code Language Model'

  constructor(private output: vscode.LogOutputChannel) {
  }

  async sendRequest(
    request: AILayoutRequest,
    signal?: AbortSignal,
  ): Promise<string> {
    const models = await vscode.lm.selectChatModels({
      vendor: 'copilot',
    })

    // Pick best available model for structured output
    const model = models.find(m => m.family.includes('sonnet'))
      ?? models.find(m => m.family.includes('claude'))
      ?? models.find(m => m.family.includes('gpt-5'))
      ?? models.find(m => m.family.includes('gpt-4'))
      ?? models[0]

    if (!model) {
      await vscode.window.showErrorMessage(
        'No AI language model available. Please install GitHub Copilot or configure an LM provider.',
      )
      throw new Error(
        'No language model available. Please ensure GitHub Copilot or another LM provider is installed.',
      )
    }

    const messages = [
      vscode.LanguageModelChatMessage.Assistant(request.systemPrompt),
      vscode.LanguageModelChatMessage.User(request.userPrompt),
      vscode.LanguageModelChatMessage.User(JSON.stringify(request.diagram, null, 2)),
    ]

    const cancellation = new vscode.CancellationTokenSource()
    if (signal) {
      signal.addEventListener('abort', () => cancellation.cancel())
    }

    // // 10-second timeout
    // const timeout = setTimeout(() => cancellation.cancel(), 10_000)

    try {
      const response = await model.sendRequest(
        messages,
        {
          justification: 'LikeC4 needs AI assistance to optimize diagram layout',
        },
        cancellation.token,
      )
      if (signal?.aborted) {
        throw new Error('Request was aborted')
      }

      let text = ''
      for await (const chunk of response.text) {
        text += chunk
        if (signal?.aborted) {
          throw new Error('Request was aborted')
        }
      }
      return text
    } finally {
      // clearTimeout(timeout)
      cancellation.dispose()
    }
  }
}
