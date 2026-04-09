import type { ComputedView } from '@likec4/core/types'
import { prepareLLMInput } from './llm-input'
import { parseOutput } from './llm-output'
import { logger } from './logger'
import { LAYOUT_SYSTEM_PROMPT } from './prompt-system.generated'
import type { AiLayoutHints, AILayoutProvider } from './types'

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
export async function enhanceLayoutWithAI(
  view: ComputedView,
  provider: AILayoutProvider,
  signal?: AbortSignal,
): Promise<AiLayoutHints | undefined> {
  const label = `------ai-layout-${view.id}-------`
  console.time(label)
  try {
    logger.debug`generating AI layout hints for ${view.id} using ${provider.name}`

    const { serialized, mapping } = prepareLLMInput(view)

    const rawResponse = await provider.sendRequest(
      {
        ...prompts,
        diagram: JSON.stringify(serialized),
      },
      signal,
    )
    console.timeEnd(label)

    return parseOutput(rawResponse, { mapping, view })
  } catch (error) {
    console.timeEnd(label)
    logger.warn`failed to generate AI layout hints: ${error}`
    return undefined
  }
}
