import type { SerializedView } from './llm-input'

/**
 * Abstract interface for AI layout hint generation.
 * Implemented by VSCode extension (using vscode.lm API) or direct API providers.
 * Defined in layouts package to avoid vscode dependency.
 */
export interface AILayoutProvider {
  /** Display name for logging/UI */
  readonly name: string

  /**
   * Send a layout hint generation request to the LLM and return the raw text response.
   * @param request - The layout request containing system prompt, user prompt, and diagram data
   * @param signal - AbortSignal for cancellation/timeout
   * @returns The raw text response from the LLM
   */
  sendRequest(
    request: AILayoutRequest,
    signal?: AbortSignal,
  ): Promise<string>
}

export interface AILayoutRequest {
  systemPrompt: string
  userPrompt: string
  /**
   * The diagram data
   */
  diagram: SerializedView
}
