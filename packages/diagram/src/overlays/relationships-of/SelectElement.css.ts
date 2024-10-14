import { style } from '@vanilla-extract/css'
import { mantine, whereDark } from '../../theme-vars'

export const node = style({
  margin: 0
})

export const label = style({
  ':hover': {
    backgroundColor: mantine.colors.gray[0]
  },
  selectors: {
    [`${whereDark} &:hover`]: {
      backgroundColor: mantine.colors.defaultHover,
      color: mantine.colors.white
    }
  }
})
