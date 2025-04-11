import { css } from '@likec4/styles/css'
// import { mantine } from '../../../theme-vars'

export const edgeNoteCloseButton = css({
  position: 'absolute',
  top: 1,
  right: 1,
  zIndex: 9,
})

export const edgeNoteText = css({
  userSelect: 'all',
  textAlign: 'left',
  whiteSpaceCollapse: 'preserve-breaks',
  textWrap: 'pretty',
  lineHeight: 1.25,
  '--text-fz': '{fontSizes.sm}',
  md: {
    '--text-fz': '{fontSizes.md}',
  },
})
