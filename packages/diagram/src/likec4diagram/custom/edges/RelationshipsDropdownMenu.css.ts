import { css } from '@likec4/styles/css'

export const menuDropdown = css({
  overflowY: 'scroll',
  minWidth: '250px',
  maxWidth: 'min(90vw, 500px)',
})

export const menuItemRelationship = css({
  gap: 4,
})

export const endpoint = css({
  display: 'block',
  fontSize: 10,
  fontWeight: 500,
  whiteSpace: 'nowrap',
  padding: '2px 5px',
  borderRadius: 2,
  background: `likec4.palette.fill/55`,
  lineHeight: 1.1,
  _dark: {
    color: 'likec4.palette.loContrast',
  },
})

export const title = css({
  whiteSpaceCollapse: 'preserve-breaks',
  fontSize: 'sm',
})
