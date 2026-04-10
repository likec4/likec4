import type { EdgeId, NodeId, NonEmptyArray, NonEmptyReadonlyArray } from '@likec4/core/types'

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
   * The diagram data as a JSON string, to be included in the user prompt or separately if the provider supports it.
   */
  diagram: string
}

/**
 * invisible edge added by AI to enforce better layout
 */
export interface AIEnforcementEdge {
  source: NodeId
  target: NodeId
  weight?: number
  minlen?: number
}

/**
 * Complete set of AI-generated layout hints.
 * This is the JSON schema the LLM must produce.
 */
export interface AiLayoutHints {
  direction?: 'TB' | 'BT' | 'LR' | 'RL'
  ranks: ReadonlyArray<{
    rank: 'same' | 'source' | 'sink' | 'min' | 'max'
    nodes: NonEmptyArray<NodeId>
  }>
  edgeWeight: Record<EdgeId, number>
  edgeMinlen: Record<EdgeId, number>
  /**
   * These edges should be reversed in DOT
   * Unique array of EdgeIds.
   */
  reverseRank?: NonEmptyReadonlyArray<EdgeId>
  /**
   * These edges should be excluded, i.e. `constraint=false` in Graphviz, to allow more flexible layouts.
   * Unique array of EdgeIds.
   */
  excludeFromRanking?: NonEmptyReadonlyArray<EdgeId>
  /**
   * Suggested order of edges for DOT output, to influence edge routing.
   */
  edgeOrder?: NonEmptyReadonlyArray<EdgeId>
  /**
   * Suggested order of nodes for DOT output, to influence node placement.
   */
  nodeOrder?: NonEmptyReadonlyArray<NodeId>
  /**
   * Invisible edges added by AI to enforce better layout
   */
  invisibleEdges?: NonEmptyReadonlyArray<AIEnforcementEdge>
  /**
   * LLM reasoning for debugging/display
   */
  reasoning: string
}
