import { style } from '@vanilla-extract/css'
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
  color: vars.element.hiContrast,
  selectors: {
    [`${whereDark} &`]: {
      // background: `color-mix(in srgb , ${vars.element.fill},  transparent 45%)`,
      // color: vars.element.loContrast
    }
  }
})

export const relationshipStat = style({
  selectors: {
    // [`${whereLight} &`]: {
    //   background: mantine.colors.gray[4],
    //   color: mantine.colors.dark[6]
    // },
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
