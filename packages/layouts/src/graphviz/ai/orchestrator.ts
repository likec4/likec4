import type { ComputedView } from '@likec4/core/types'
import { prepareLLMInput } from './llm-input'
import { parseOutput } from './llm-output'
import { logger } from './logger'
import { LAYOUT_SYSTEM_PROMPT } from './prompt-system.generated'
import type { AILayoutHints, AILayoutProvider } from './types'

const prompts = {
  systemPrompt: LAYOUT_SYSTEM_PROMPT,
  userPrompt: `Analyze semantics and suggest layout for the diagram.`,
}

/**
 * Orchestrate the AI layout enhancement pipeline:
 * serialize view → build prompt → call LLM → parse hints.
 *
 * Returns undefined (never throws) on any failure — layout falls back to plain Graphviz.
 */
export async function enhanceLayoutWithAI<CancelToken>(
  view: ComputedView,
  provider: AILayoutProvider<CancelToken>,
  signal: CancelToken,
): Promise<AILayoutHints | undefined> {
  try {
    logger.debug`generating AI layout hints for ${view.id} using ${provider.name}`

    const { serialized, mapping } = prepareLLMInput(view)

    const rawResponse = await provider.sendRequest(
      {
        ...prompts,
        view,
        mapping,
        diagram: JSON.stringify(serialized),
      },
      signal,
    )
    return parseOutput(rawResponse, { mapping, view })
  } catch (error) {
    logger.warn`AI layout enhancement failed: ${error}`
    return undefined
  }
}
