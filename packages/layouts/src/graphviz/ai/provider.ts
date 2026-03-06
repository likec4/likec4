/**
 * Abstract interface for AI layout hint generation.
 * Implemented by VSCode extension (using vscode.lm API) or direct API providers.
 * Defined in layouts package to avoid vscode dependency.
 */
export interface AILayoutProvider {
  /** Display name for logging/UI */
  readonly name: string

  /**
   * Send prompts to an LLM and get text back.
   * @param systemPrompt - System/instruction prompt
   * @param userPrompt - User message with the serialized view
   * @param signal - AbortSignal for cancellation/timeout
   * @returns The raw text response from the LLM
   */
  generateText(
    systemPrompt: string,
    userPrompt: string,
    signal?: AbortSignal,
  ): Promise<string>
}
