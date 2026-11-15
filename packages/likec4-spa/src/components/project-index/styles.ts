import { css } from '@likec4/styles/css'

const textSecondary = {
  color: '[var(--mantine-color-gray-7)]',
  _dark: {
    color: '[var(--mantine-color-dark-1)]',
  },
} as const

export const preview = css({
  position: 'relative',
  height: '[180px]',
  overflow: 'hidden',
  borderTopRadius: 'md',
  borderBottomWidth: '1',
  borderBottomStyle: 'solid',
  borderColor: 'border.subtle',
  backgroundColor: 'surface.canvas',
  backgroundImage: '[radial-gradient(var(--colors-diagram-background-pattern) 1px, transparent 1px)]',
  backgroundSize: '[16px 16px]',
})

export const cardBody = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  paddingTop: '4',
  paddingX: '5',
  paddingBottom: '5',
})

export const cardHead = css({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '2',
  minWidth: '0',
  '& > svg': {
    flexShrink: '0',
    marginTop: '[3px]',
    ...textSecondary,
  },
})

export const meta = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1.5',
  minWidth: '0',
  fontSize: 'xs',
  ...textSecondary,
  '& > span': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
})

export const viewTitle = css({
  margin: '0',
  fontFamily: 'body',
  fontSize: 'md',
  fontWeight: 'semibold',
  lineHeight: '[1.35]',
  color: 'text.bright',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

/**
 * Markdown description, cut to three lines however long it is
 */
export const description = css({
  maxHeight: '[calc(3 * 1.5em)]',
  overflow: 'hidden',
  lineClamp: '3',
  '& :is(h1, h2, h3, h4, h5, h6)': {
    fontSize: '[1em]',
    margin: '0',
  },
  '& > * + *': {
    marginTop: '[0.25em]',
  },
})

export const burger = css({
  flexShrink: '0',
})
