import { styled } from '@likec4/styles/jsx'

const numberFormat = new Intl.NumberFormat('en-US')

/**
 * Formats a count for display, `—` for unknown
 */
export function formatCount(value: number | null): string {
  return value === null ? '—' : numberFormat.format(value)
}

/**
 * Single line, cut with an ellipsis
 */
export const Truncate = styled('span', {
  base: {
    minWidth: '0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
})

/**
 * Small uppercase caption above a value
 */
export const FieldLabel = styled('span', {
  base: {
    fontSize: 'micro',
    lineHeight: '[1.05]',
    fontWeight: 'semibold',
    letterSpacing: '[0.08em]',
    textTransform: 'uppercase',
    color: 'text.dimmed',
  },
})

/**
 * Dimmed tabular number next to a label
 */
export const Count = styled('span', {
  base: {
    flexShrink: '0',
    color: 'text.dimmed',
    fontFamily: 'body',
    fontSize: 'xs',
    fontVariantNumeric: 'tabular-nums',
  },
})

/**
 * Dimmed note, e.g. "—" or "No dependencies"
 */
export const EmptyNote = styled('span', {
  base: {
    fontFamily: 'body',
    fontSize: 'xs',
    color: 'text.dimmed',
  },
})
