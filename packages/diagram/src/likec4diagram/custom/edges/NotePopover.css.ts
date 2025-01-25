import { style } from '@vanilla-extract/css'
import { mantine } from '../../../theme-vars'

export const edgeNoteCloseButton = style({
  position: 'absolute',
  top: 1,
  right: 1,
  zIndex: 9,
})

export const edgeNoteText = style({
  userSelect: 'all',
  textAlign: 'left',
  whiteSpaceCollapse: 'preserve-breaks',
  textWrap: 'pretty',
  lineHeight: 1.25,
  vars: {
    '--text-fz': mantine.fontSizes.sm,
  },
  '@media': {
    [mantine.largerThan('md')]: {
      vars: {
        '--text-fz': mantine.fontSizes.md,
      },
    },
  },
})
