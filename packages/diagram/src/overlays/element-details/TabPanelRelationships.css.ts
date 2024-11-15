import { globalStyle, style } from '@vanilla-extract/css'
import { mantine, vars, whereDark, whereLight } from '../../theme-vars'

export const fqn = style({
  display: 'inline-block',
  fontSize: mantine.fontSizes.sm,
  fontWeight: 500,
  whiteSpace: 'nowrap',
  padding: '3px 6px',
  borderRadius: 3,
  background: `color-mix(in srgb , ${vars.element.fill},  transparent 25%)`,
  lineHeight: 1.2,
  color: vars.element.hiContrast
  // selectors: {
  //   [`${whereDark} &`]: {
  //   }
  // }
})

export const relationshipStat = style({
  selectors: {
    [`${whereLight} &`]: {
      background: mantine.colors.gray[1]
    },
    // [`&[data-zero]`]: {
    //   color: mantine.colors.dimmed
    // },
    // [`${whereLight} &[data-zero]`]: {
    //   background: mantine.colors.gray[3]
    // },
    [`&[data-missing]`]: {
      color: mantine.colors.orange[4],
      background: `color-mix(in srgb, ${mantine.colors.orange[8]} 15%, transparent)`,
      borderColor: `color-mix(in srgb, ${mantine.colors.orange[5]} 20%, transparent)`
    },
    [`${whereLight} &[data-missing]`]: {
      color: mantine.colors.orange[8]
    }
  }
})

export const xyflow = style({
  flex: '1 1 100%',
  position: 'relative',
  width: '100%',
  height: '100%',
  background: mantine.colors.body,
  border: `1px solid ${mantine.colors.defaultBorder}`,
  borderRadius: mantine.radius.sm,
  selectors: {
    [`${whereLight} &`]: {
      borderColor: mantine.colors.gray[3],
      background: mantine.colors.gray[1]
    }
  }
})

export const panelScope = style({
  ':before': {
    content: 'scope:',
    position: 'absolute',
    top: 0,
    left: 8,
    fontSize: 9,
    fontWeight: 500,
    lineHeight: 1,
    color: mantine.colors.dimmed,
    opacity: 0.85,
    transform: 'translateY(-100%) translateY(-2px)'
  }
})

globalStyle(`${whereLight} ${panelScope} .mantine-SegmentedControl-root`, {
  background: mantine.colors.gray[3]
})

export const edgeNum = style({
  display: 'inline-block',
  fontSize: mantine.fontSizes.xl,
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
