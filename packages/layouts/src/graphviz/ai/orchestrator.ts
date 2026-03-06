import type { ComputedView } from '@likec4/core/types'
import { createLogger } from '@likec4/log'
import { buildLayoutPrompt, LAYOUT_SYSTEM_PROMPT } from './prompt'
import type { AILayoutProvider } from './provider'
import { serializeViewForPrompt } from './serializeView'
import { type LayoutHints, parseLayoutHints } from './types'

const logger = createLogger('ai-layout')

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
): Promise<LayoutHints | null> {
  try {
    logger.debug`generating AI layout hints for ${view.id} using ${provider.name}`

    const serialized = serializeViewForPrompt(view)
    const userPrompt = buildLayoutPrompt(serialized)

    const rawResponse = await provider.generateText(
      LAYOUT_SYSTEM_PROMPT,
      userPrompt,
      signal,
    )

    const hints = parseLayoutHints(rawResponse)

    if (!hints) {
      logger.warn`AI response could not be parsed for view ${view.id}`
      return null
    }

    logger.debug`generated hints for ${view.id}: ${JSON.stringify(hints)}`
    return hints
  } catch (error) {
    logger.warn`failed to generate AI layout hints: ${error}`
    return null
  }
}
