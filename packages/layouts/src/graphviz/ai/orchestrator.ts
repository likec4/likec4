import type { ComputedView } from '@likec4/core/types'
import { prepareViewForPrompt } from './llm-input'
import { parseOutput } from './llm-output'
import { logger } from './logger'
import { LAYOUT_SYSTEM_PROMPT } from './prompt-system.generated'
import type { AILayoutProvider } from './provider'
import type { AiLayoutHints } from './types'

const prompts = {
  systemPrompt: LAYOUT_SYSTEM_PROMPT,
  userPrompt: `Analyze this diagram and suggest layout improvements if any`,
}

/**
 * Orchestrate the AI layout enhancement pipeline:
 * serialize view → build prompt → call LLM → parse hints.
 *
 * Returns null (never throws) on any failure — layout falls back to plain Graphviz.
 */
export async function enhanceLayoutWithAI(
  view: ComputedView,
  provider: AILayoutProvider,
  signal?: AbortSignal,
): Promise<AiLayoutHints | null> {
  const label = `------ai-layout-${view.id}-------`
  console.time(label)
  try {
    logger.debug`generating AI layout hints for ${view.id} using ${provider.name}`

    const { serialized, mapping } = prepareViewForPrompt(view)

    const rawResponse = await provider.sendRequest(
      {
        ...prompts,
        diagram: serialized,
      },
      signal,
    )
    console.timeEnd(label)

    return parseOutput(rawResponse, { mapping, view })
  } catch (error) {
    console.timeEnd(label)
    logger.warn`failed to generate AI layout hints: ${error}`
    return null
  }
}
