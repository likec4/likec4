import { css } from '@likec4/styles/css'

export const menuDropdown = css({
  overflowY: 'scroll',
  minWidth: '250px',
  maxWidth: 'min(90vw, 500px)',
})

export const menuItemRelationship = css({
  // padding: mantine.spacing.sm,
  // paddingTop: mantine.spacing.xs,
  // borderRadius: mantine.radius.sm,
  // paddingTop: mantine.spacing.xs,
  // paddingBottom: mantine.spacing.xs,
  gap: 4,
  // cursor: 'pointer',
  // _hover: {
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

export const endpoint = css({
  display: 'block',
  fontSize: 10,
  fontWeight: 500,
  whiteSpace: 'nowrap',
  padding: '2px 5px',
  borderRadius: 2,
  background: `likec4.element.fill/55`,
  lineHeight: 1.1,
  _dark: {
    color: 'likec4.element.loContrast',
  },
})

export const title = css({
  whiteSpaceCollapse: 'preserve-breaks',
  fontSize: 'sm',
})
