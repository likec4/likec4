import type { AILayoutProvider } from '@likec4/layouts/ai'
import * as vscode from 'vscode'

/**
 * AI layout provider using VS Code Language Model API (e.g. GitHub Copilot).
 */
export class VscodeLmProvider implements AILayoutProvider {
  readonly name = 'VS Code Language Model'

  async generateText(
    systemPrompt: string,
    userPrompt: string,
    signal?: AbortSignal,
  ): Promise<string> {
    const models = await vscode.lm.selectChatModels({ vendor: 'copilot' })
    const model = models[0]
    if (!model) {
      throw new Error(
        'No language model available. Please ensure GitHub Copilot or another LM provider is installed.',
      )
    }

    const messages = [
      vscode.LanguageModelChatMessage.User(systemPrompt),
      vscode.LanguageModelChatMessage.User(userPrompt),
    ]

    const cancellation = new vscode.CancellationTokenSource()
    if (signal) {
      signal.addEventListener('abort', () => cancellation.cancel())
    }

    // 10-second timeout
    const timeout = setTimeout(() => cancellation.cancel(), 10_000)

    try {
      const response = await model.sendRequest(
        messages,
        { justification: 'LikeC4 needs AI assistance to optimize diagram layout' },
        cancellation.token,
      )

      let text = ''
      for await (const chunk of response.text) {
        text += chunk
      }
      return text
    } finally {
      clearTimeout(timeout)
      cancellation.dispose()
    }
  }
}
