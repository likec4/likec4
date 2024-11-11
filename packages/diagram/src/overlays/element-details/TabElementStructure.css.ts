import { globalStyle, style } from '@vanilla-extract/css'
import { easings, mantine, transitions, whereDark } from '../../theme-vars'

export const treeNodeLabel = style({
  marginTop: mantine.spacing.sm,
  marginBottom: mantine.spacing.sm
})

export const elementLabel = style({
  display: 'inline-flex',
  transition: transitions.fast,
  border: `1px dashed ${mantine.colors.defaultBorder}`,
  borderRadius: mantine.radius.sm,
  padding: `${mantine.spacing.xs} ${mantine.spacing.md}`,
  alignItems: 'center',
  cursor: 'pointer',
  color: mantine.colors.gray[7],
  ':hover': {
    transitionTimingFunction: easings.out,
    borderStyle: 'solid',
    color: mantine.colors.defaultColor,
    background: mantine.colors.defaultHover
  },
  selectors: {
    [`${whereDark} &`]: {
      color: mantine.colors.dark[1]
    }
  }
})
globalStyle(`${elementLabel} > *`, {
  transition: transitions.fast
})
globalStyle(`${elementLabel}:hover > *`, {
  transitionTimingFunction: easings.out,
  transform: 'translateX(1px)'
})
