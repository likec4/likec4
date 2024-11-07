import { createVar, globalStyle, style } from '@vanilla-extract/css'
import { mantine, vars, whereDark, whereLight } from '../../../theme-vars'

const bg = createVar('bg')

export const container = style({
  backgroundColor: mantine.colors.body,
  pointerEvents: 'all',
  position: 'absolute',
  top: 0,
  left: 0,
  zIndex: 100,
  vars: {
    [bg]: `linear-gradient(180deg, ${vars.element.fill}, ${vars.element.fill} 3px, transparent 3px)`
  },
  backgroundImage: bg,
  selectors: {
    [`${whereDark} &`]: {
      backgroundColor: mantine.colors.dark[6],
      vars: {
        [bg]: `
        linear-gradient(180deg, color-mix(in srgb, ${vars.element.fill} 10%, transparent), transparent 60px),
        linear-gradient(180deg, ${vars.element.fill}, ${vars.element.fill} 3px, transparent 3px)
      `
      }
    }
  }
})

export const noPointerEvents = style({
  pointerEvents: 'none'
})

export const fqn = style({
  display: 'inline-block',
  fontSize: mantine.fontSizes.xs,
  fontWeight: 500,
  whiteSpace: 'nowrap',
  padding: '3px 5px',
  borderRadius: 2,
  background: `color-mix(in srgb , ${vars.element.fill},  transparent 25%)`,
  lineHeight: 1.2,
  color: vars.element.hiContrast,
  selectors: {
    [`${whereDark} &`]: {
      // background: `color-mix(in srgb , ${vars.element.fill},  transparent 45%)`,
      // color: vars.element.loContrast
    }
  }
})

export const edgeNum = style({
  display: 'inline-block',
  fontSize: mantine.fontSizes.sm,
  fontWeight: 600,
  padding: '1px 5px',
  minWidth: 24,
  textAlign: 'center',
  borderRadius: mantine.radius.sm,
  background: mantine.colors.dark[7],
  color: mantine.colors.defaultColor,
  selectors: {
    [`${whereLight} &`]: {
      background: mantine.colors.gray[4],
      color: mantine.colors.dark[6]
    },
    [`&[data-zero]`]: {
      color: mantine.colors.dimmed
    },
    [`${whereLight} &[data-zero]`]: {
      background: mantine.colors.gray[3]
    },
    [`&[data-missing]`]: {
      color: mantine.colors.orange[4],
      background: `color-mix(in srgb, ${mantine.colors.orange[8]} 20%, transparent)`
    },
    [`${whereLight} &[data-missing]`]: {
      color: mantine.colors.orange[8]
    }
  }
})

export const viewButton = style({
  paddingLeft: 2,
  height: 'auto'
})

globalStyle(`${viewButton} .mantine-Button-label`, {
  color: mantine.colors.text,
  fontWeight: 500,
  flexDirection: 'column',
  alignItems: 'flex-start'
})
globalStyle(`${viewButton} .tabler-icon`, {
  width: '75%',
  opacity: 0.75
})

globalStyle(`${whereLight} ${viewButton} .mantine-Button-label`, {
  color: mantine.colors.dark[3]
})
