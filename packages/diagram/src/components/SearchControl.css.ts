import { createVar, fallbackVar, globalStyle, style } from '@vanilla-extract/css'
import { mantine, transitions, vars, whereDark, whereLight } from '../theme-vars'

const transparent = createVar('transparent')
const bgColor = createVar('bgcolor')
export const root = style({
  height: '32px',
  paddingLeft: mantine.spacing.sm,
  paddingRight: '4px',
  borderRadius: mantine.radius.sm,
  color: mantine.colors.placeholder,
  boxShadow: mantine.shadows.xs,
  border: '1px solid',
  cursor: 'pointer',
  transition: transitions.fast,
  WebkitBackdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(8px)'),
  backdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(8px)'),
  backgroundColor: `color-mix(in srgb, ${bgColor}, transparent ${transparent})`,
  vars: {
    [transparent]: '20%',
    [bgColor]: mantine.colors.default,
  },
  selectors: {
    [`${whereLight} &`]: {
      borderColor: mantine.colors.gray[4],
      vars: {
        [bgColor]: mantine.colors.white,
      },
    },
    [`${whereDark} &`]: {
      borderColor: mantine.colors.dark[4],
      vars: {
        [bgColor]: mantine.colors.dark[6],
      },
    },
  },
  ':hover': {
    borderColor: mantine.colors.defaultBorder,
    boxShadow: mantine.shadows.sm,
    vars: {
      [transparent]: '10%',
      [bgColor]: mantine.colors.defaultHover,
    },
  },
})
globalStyle(`${root} .tabler-icon`, {
  color: mantine.colors.text,
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
