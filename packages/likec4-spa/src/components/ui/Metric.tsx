import { styled } from '@likec4/styles/jsx'
import { FieldLabel, formatCount } from './Text'

const MetricBox = styled('div', {
  base: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2',
    minWidth: '0',
  },
})

const MetricValue = styled('span', {
  base: {
    fontFamily: 'body',
    fontSize: 'xl',
    lineHeight: '[1.1]',
    fontWeight: 'medium',
    letterSpacing: '[-0.02em]',
    color: 'text.bright',
    fontVariantNumeric: 'tabular-nums',
  },
  variants: {
    size: {
      md: {},
      lg: {
        fontSize: '[20px]',
      },
    },
  },
})

/**
 * Labelled number
 */
export function Metric({ label, value, size = 'md' }: { label: string; value: number | null; size?: 'md' | 'lg' }) {
  return (
    <MetricBox>
      <FieldLabel>{label}</FieldLabel>
      <MetricValue size={size}>{formatCount(value)}</MetricValue>
    </MetricBox>
  )
}

/**
 * Row of metrics in a page header
 */
export const MetricsRow = styled('div', {
  base: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: { base: '5', sm: '8' },
  },
})

/**
 * Metrics in a hover card
 */
export const MetricsGrid = styled('div', {
  base: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, auto)',
    gap: '6',
    paddingY: '3',
    paddingX: '4',
  },
})
