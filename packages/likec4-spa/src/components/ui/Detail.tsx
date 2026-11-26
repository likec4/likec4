import { styled } from '@likec4/styles/jsx'

const detail = {
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  minWidth: '0',
  fontSize: 'sm',
  color: 'text',
  '& > svg': {
    flexShrink: '0',
    color: 'text.dimmed',
  },
  '& > span': {
    minWidth: '0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
} as const

const dimmed = {
  true: {
    '& > span': {
      color: 'text.dimmed',
    },
  },
} as const

/**
 * Icon and a single line of text, e.g. a contact or a path
 */
export const Detail = styled('div', {
  base: {
    ...detail,
    cursor: 'default',
  },
  variants: {
    dimmed,
  },
})

/**
 * {@link Detail} that acts on click
 */
export const DetailButton = styled('button', {
  base: {
    ...detail,
    appearance: 'none',
    background: 'none',
    border: 'none',
    padding: '0',
    textAlign: 'left',
    cursor: 'pointer',
    width: 'fit-content',
    maxWidth: '100%',
    '&:hover > span': {
      color: 'text.link',
      textDecoration: 'underline',
    },
  },
  variants: {
    dimmed,
  },
})
