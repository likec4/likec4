import { style } from '@vanilla-extract/css'
import { mantine, vars } from '../../../theme-vars'

export const menuDropdown = style({
  minWidth: 250,
  maxWidth: 'min(90vw, 500px)',
})

export const menuItemRelationship = style({
  // padding: mantine.spacing.sm,
  // paddingTop: mantine.spacing.xs,
  // borderRadius: mantine.radius.sm,
  // paddingTop: mantine.spacing.xs,
  // paddingBottom: mantine.spacing.xs,
  gap: 4,
  // cursor: 'pointer',
  // ':hover': {
  // borderColor: mantine.colors.gray.light,
  // background: mantine.colors.gray[2]
  // },

  // selectors: {
  //   [`:where([data-mantine-color-scheme="dark"]) &`]: {
  //     // borderColor: mantine.colors.dark[6]
  //   },
  //   [`:where([data-mantine-color-scheme="dark"]) &:hover`]: {
  //     // background: mantine.colors.dark[5]
  //   }
  // }
})

export const endpoint = style({
  display: 'block',
  fontSize: 10,
  fontWeight: 500,
  whiteSpace: 'nowrap',
  padding: '2px 5px',
  borderRadius: 2,
  background: `color-mix(in srgb , ${vars.element.fill},  transparent 45%)`,
  lineHeight: 1.1,
  selectors: {
    [`:where([data-mantine-color-scheme="dark"]) &`]: {
      color: vars.element.loContrast,
    },
  },
})

export const title = style({
  whiteSpaceCollapse: 'preserve-breaks',
  fontSize: mantine.fontSizes.sm,
})
//
// export const sourceId = style({
//
// })
//
// export const targetId = style({
//   fontSize: 11,
//   whiteSpace: 'nowrap'
// })
