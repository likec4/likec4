import { styled } from '@likec4/styles/jsx'
import type { ComponentProps } from 'react'

const Scroll = styled('div', {
  base: {
    overflowX: 'auto',
  },
})

const Table = styled('table', {
  base: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0',
    borderWidth: '1',
    borderStyle: 'solid',
    borderColor: 'border.subtle',
    borderRadius: 'md',
    overflow: 'hidden',
    fontSize: 'sm',
    '& th': {
      textAlign: 'left',
      fontFamily: 'body',
      fontSize: 'xxs',
      fontWeight: 'medium',
      letterSpacing: '[0.06em]',
      textTransform: 'uppercase',
      paddingX: '4',
      paddingY: '3',
      backgroundColor: 'surface.sunken',
      borderBottomWidth: '1',
      borderBottomStyle: 'solid',
      borderColor: 'border.subtle',
      whiteSpace: 'nowrap',
      color: 'text.dimmed',
    },
    '& td': {
      paddingX: '4',
      paddingY: '3',
      borderBottomWidth: '1',
      borderBottomStyle: 'solid',
      borderColor: 'border.subtle',
      verticalAlign: 'middle',
      backgroundColor: 'surface.default',
    },
    '& td > a': {
      display: 'block',
      color: 'inherit',
      textDecoration: 'none',
    },
    '& tbody tr:last-child td': {
      borderBottom: 'none',
    },
    '& tbody tr': {
      cursor: 'pointer',
    },
    '& tbody tr:hover td': {
      backgroundColor: 'surface.hover',
    },
    '& [data-num]': {
      textAlign: 'right',
      fontFamily: 'body',
      fontVariantNumeric: 'tabular-nums',
    },
    '& [data-dimmed]': {
      color: 'text.dimmed',
    },
  },
})

/**
 * Bordered table that scrolls horizontally when it does not fit.
 * Cells take `data-num` (right-aligned numbers) and `data-dimmed`
 */
export function DataTable(props: ComponentProps<typeof Table>) {
  return (
    <Scroll>
      <Table {...props} />
    </Scroll>
  )
}

/**
 * Icon and name in the first column
 */
export const TableName = styled('span', {
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: '2',
    fontWeight: 'medium',
    color: 'text.bright',
    whiteSpace: 'nowrap',
    maxWidth: '[320px]',
    '& > span:last-child': {
      minWidth: '0',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  },
})
