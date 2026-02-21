import type { Fqn } from '@likec4/core/types'
import z from 'zod/v4'

export const searchParamsSchema = z.object({
  theme: z.literal(['light', 'dark', 'auto'])
    .optional()
    .catch(undefined),
  dynamic: z.enum(['diagram', 'sequence'])
    .default('diagram')
    .catch('diagram'),
  padding: z.number()
    .min(0)
    .default(20)
    .catch(20),
  relationships: z.string()
    .nonempty()
    .optional()
    .catch(undefined)
    .transform(v => v as Fqn | undefined),
})

export type SearchParams = z.infer<typeof searchParamsSchema>

/**
 * Derives the Mantine `forceColorScheme` value from the parsed `?theme=` param.
 *
 * - `'light'` / `'dark'` → force that scheme (overrides localStorage, read-only)
 * - `'auto'` or `undefined` → no force (Mantine uses localStorage / system preference)
 */
export function resolveForceColorScheme(
  theme: SearchParams['theme'],
): 'light' | 'dark' | undefined {
  switch (theme) {
    case 'light':
    case 'dark':
      return theme
    default:
      return undefined
  }
}
