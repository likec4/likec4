import { logger } from '@likec4/log'
import { filter, isNonNullish, pickBy } from 'remeda'
import * as z from 'zod/v4'

const direction = z.enum(['TB', 'BT', 'LR', 'RL'])

const nodeId = z.string().nonempty().brand<'NodeId'>()
const edgeId = z.string().nonempty().brand<'EdgeId'>()

const edgeattrs = z
  .object({
    weight: z.coerce.number().int().min(0).max(100),
    minlen: z.coerce.number().int().min(0).max(20),
    constraint: z.boolean(),
  })
  .partial()

const edgeHintSchema = edgeattrs
  .extend({
    id: edgeId,
  })
  .refine(data => data.weight !== undefined || data.minlen !== undefined || data.constraint !== undefined, {
    message: 'At least one of weight, minlen, or constraint must be specified',
  })
  .transform(pickBy(isNonNullish))

// const enforcementSchema = edgeattrs
//   .extend({
//     source: nodeId,
//     target: nodeId,
//   })
//   .transform(pickBy(isNonNullish))

const responseSchema = z.object({
  direction: direction.optional().catch(undefined),
  edges: z
    .array(
      edgeHintSchema.nullable().catch(null),
    )
    .default([])
    .transform(filter(isNonNullish)),
  sources: z.array(nodeId).catch([]),
  sinks: z.array(nodeId).catch([]),
  enforcements: z
    .array(edgeHintSchema.nullable().catch(null))
    .default([])
    .transform(filter(isNonNullish)),
  reasoning: z.string().default(''),
}).refine(
  (data) => {
    return (data.sources.length === 0 && data.sinks.length === 0) || (data.edges.length > 0) ||
      data.enforcements.length > 0
  },
  {
    message: 'If sources or sinks are provided, edges must also be provided',
  },
)

/**
 * Extract JSON from a string that may contain markdown code fences.
 */

const jsonRegex = /```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/
function extractJson(text: string): string {
  const match = jsonRegex.exec(text)
  if (match && match[1]) {
    return match[1]
  }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1)
  }
  return text.trim()
}

/**
 * Parse raw LLM text output into validated LayoutHints.
 * Returns null on any failure (malformed JSON, invalid structure, etc.)
 * @param response - The raw text response from the LLM, potentially containing JSON with layout hints
 */
export function parseResponse(response: string): z.infer<typeof responseSchema> | null {
  const log = logger.getChild('parser')
  try {
    console.log('---Parsing LLM response---')
    console.log(response)
    console.log('---End Parsing LLM response---')
    const jsonStr = extractJson(response)
    console.log('---Extracted JSON---')
    console.log(jsonStr)
    console.log('---End Extracted JSON---')
    const parsed = JSON.parse(jsonStr)
    const result = responseSchema.safeParse(parsed, {})
    if (!result.success) {
      console.log('---Validation Error---')
      console.log(z.prettifyError(result.error))
      console.log('---End Validation Error---')
      // log.warn(z.prettifyError(result.error))
      return null
    }
    console.log('---Parsed Data---')
    console.log(JSON.stringify(result.data, null, 2))
    console.log('---End Parsed Data---')
    return result.data
  } catch (e) {
    log.warn('Failed to parse LLM response', { error: e })
    return null
  }
}
