import { rem } from '@mantine/core'
import { fallbackVar, globalStyle, style } from '@vanilla-extract/css'
import { calc } from '@vanilla-extract/css-utils'
import { mantine, vars, whereNotReducedGraphics, whereReducedGraphics } from '../../../theme-vars'

export const navigationButtons = style({
  gap: calc(mantine.spacing.xs).divide(1.5).toString(),
  ':empty': {
    display: 'none',
  },
})

export const panel = style({
  top: fallbackVar(vars.navigationPanel.top, '1rem'),
  left: fallbackVar(vars.navigationPanel.left, '1rem'),
  margin: 0,
  pointerEvents: 'none',
})

globalStyle(`${panel} :where(button, .action-icon, [role="dialog"])`, {
  pointerEvents: 'all',
})

globalStyle(`${whereReducedGraphics} ${panel} .action-icon`, {
  vars: {
    '--ai-radius': '0px',
  },
})

globalStyle(`.likec4-top-left-panel .action-icon`, {
  vars: {
    ['--ai-size']: '2rem',
  },
})
globalStyle(`.likec4-top-left-panel .action-icon .tabler-icon`, {
  width: '65%',
  height: '65%',
})

export const actionIconGroup = style({
  selectors: {
    [`${whereNotReducedGraphics} &`]: {
      boxShadow: mantine.shadows.md,
    },
  },
})

export const autolayoutIcon = style({})

globalStyle(`${autolayoutIcon} .tabler-icon`, {
  width: '65%',
  height: '65%',
})

export const autolayoutButton = style({
  flex: '1 1 40%',
  textAlign: 'center',
  fontWeight: 500,
  padding: '4px 6px',
  fontSize: rem(11),
  zIndex: 1,
})

export const autolayoutIndicator = style({
  background: mantine.colors.gray[2],
  borderRadius: mantine.radius.sm,
  border: `1px solid ${mantine.colors.gray[3]}`,
  selectors: {
    [`:where([data-mantine-color-scheme="dark"]) &`]: {
      background: mantine.colors.dark[5],
      borderColor: mantine.colors.dark[4],
    },
  },
})

export const spacingSliderBody = style({
  position: 'relative',
  borderRadius: mantine.radius.sm,
  background: mantine.colors.gray[3],
  boxShadow: 'inset 1px 1px 3px 0px #00000024',
  selectors: {
    [`:where([data-mantine-color-scheme="dark"]) &`]: {
      background: mantine.colors.dark[7],
    },
  },
})

export const spacingSliderThumb = style({
  position: 'absolute',
  width: 8,
  height: 8,
  border: `2px solid ${mantine.colors.gray[5]}`,
  borderRadius: 3,
  transform: 'translate(-50%, -50%)',
})
