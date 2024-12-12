import { rem, Text, ThemeIcon } from '@mantine/core'
import { globalStyle, style } from '@vanilla-extract/css'
import { easings, mantine, transitions, whereDark } from '../../theme-vars'

export const treeNode = style({})
globalStyle(`${treeNode}[data-level='1']`, {
  marginBottom: rem(16)
})

export const treeNodeLabel = style({
  cursor: 'default',
  marginTop: 0,
  marginBottom: 0
})

const label = style({
  transition: transitions.fast,
  color: mantine.colors.gray[7],
  ':hover': {
    transitionTimingFunction: easings.out
  },
  selectors: {
    [`${whereDark} &`]: {
      color: mantine.colors.dark[1]
    }
  }
})
globalStyle(`${label} > *`, {
  transition: transitions.fast
})
globalStyle(`${label}:hover > :not([data-no-transform])`, {
  transitionTimingFunction: easings.out,
  transform: 'translateX(1px)'
})
globalStyle(`.mantine-Button-root:hover ${label} > :not([data-no-transform])`, {
  transitionTimingFunction: easings.out,
  transform: 'translateX(1px)'
})

export const nodeLabel = style([label, {}])

export const instanceLabel = style([label, {
  cursor: 'pointer',
  width: '100%',
  justifyContent: 'stretch',
  flexWrap: 'nowrap',
  height: rem(36),
  paddingInlineStart: rem(16),
  paddingInlineEnd: rem(10),
  borderRadius: mantine.radius.sm,
  alignItems: 'center',
  color: mantine.colors.gray[7],
  selectors: {
    [`${whereDark} &`]: {
      color: mantine.colors.gray.lightColor
    }
  },
  ':hover': {
    background: mantine.colors.gray.lightHover
  }
}])
globalStyle(`${instanceLabel} .tabler-icon`, {
  transition: transitions.fast,
  width: '90%',
  opacity: 0.65
})
// globalStyle(`.mantine-Button-root:hover ${instanceLabel} .tabler-icon`, {
//   opacity: 0.8
// })
