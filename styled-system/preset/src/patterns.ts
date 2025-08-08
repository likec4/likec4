import type { Config } from '@pandacss/dev'

type ExtendablePatternConfig = NonNullable<Config['patterns']>

export const patterns: ExtendablePatternConfig = {
  extend: {
    vstack: {
      defaultValues: {
        alignItems: 'stretch',
        gap: 'sm',
      },
    },
    hstack: {
      defaultValues: {
        gap: 'sm',
      },
    },
    box: {
      jsx: ['Box', 'MarkdownBlock'],
    },
  },
}
