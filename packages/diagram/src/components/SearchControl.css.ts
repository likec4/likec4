import { createVar, fallbackVar, style } from '@vanilla-extract/css'
import { mantine, transitions, vars, whereDark, whereLight } from '../theme-vars'

const transparent = createVar('transparent')
export const root = style({
  height: '34px',
  paddingLeft: mantine.spacing.sm,
  paddingRight: '4px',
  borderRadius: mantine.radius.md,
  color: mantine.colors.text,
  boxShadow: mantine.shadows.sm,
  border: '1px solid',
  cursor: 'pointer',
  transition: transitions.fast,
  WebkitBackdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(8px)'),
  backdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(8px)'),
  vars: {
    [transparent]: '40%',
  },
  selectors: {
    [`${whereLight} &`]: {
      borderColor: `color-mix(in srgb, ${mantine.colors.gray[4]}, transparent 10%)`,
      backgroundColor: `color-mix(in srgb, ${mantine.colors.white}, transparent ${transparent})`,
    },
    [`${whereDark} &`]: {
      color: mantine.colors.text,
      borderColor: `color-mix(in srgb, ${mantine.colors.dark[4]}, transparent 10%)`,
      backgroundColor: `color-mix(in srgb, ${mantine.colors.dark[6]}, transparent ${transparent})`,
    },
  },
  ':hover': {
    borderColor: mantine.colors.defaultBorder,
    vars: {
      [transparent]: '0%',
    },
  },
})

export const shortcut = style({
  fontSize: '11px',
  lineHeight: 1,
  padding: '4px 7px',
  borderRadius: mantine.radius.sm,
  border: '1px solid',
  fontWeight: 'bold',
  selectors: {
    [`${whereLight} &`]: {
      color: mantine.colors.gray[7],
      borderColor: mantine.colors.gray[2],
      backgroundColor: `color-mix(in srgb, ${mantine.colors.gray[2]}, transparent 20%)`,
    },
    [`${whereDark} &`]: {
      color: mantine.colors.dark[0],
      borderColor: mantine.colors.dark[7],
      backgroundColor: mantine.colors.dark[8],
    },
  },
})
