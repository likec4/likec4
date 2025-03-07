import { createVar, fallbackVar, globalStyle, style } from '@vanilla-extract/css'
import { mantine, transitions, vars, whereDark, whereLight, whereNotReducedGraphics } from '../theme-vars'

const transparent = createVar('transparent')
const bgColor = createVar('bgcolor')
export const root = style({
  height: '30px',
  paddingLeft: mantine.spacing.sm,
  paddingRight: '4px',
  borderRadius: '0px',
  color: fallbackVar('var(--search-color)', mantine.colors.placeholder),
  border: '1px solid',
  cursor: 'pointer',
  backgroundColor: bgColor,
  width: '100%',
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
    [`${whereNotReducedGraphics} &`]: {
      transition: transitions.fast,
      borderRadius: fallbackVar('var(--search-border-radius)', mantine.radius.sm),
      backgroundColor: `color-mix(in srgb, ${bgColor}, transparent ${transparent})`,
      boxShadow: mantine.shadows.xs,
      WebkitBackdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(8px)'),
      backdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(8px)'),
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

export const placeholder = style({
  fontSize: mantine.fontSizes.sm,
  fontWeight: 500,
  paddingRight: 50,
  flex: 1,
})

export const shortcut = style({
  fontSize: '11px',
  fontWeight: 600,
  lineHeight: 1,
  padding: '4px 7px',
  borderRadius: mantine.radius.sm,
  border: '1px solid',
  selectors: {
    [`${whereLight} &`]: {
      color: mantine.colors.gray[7],
      borderColor: mantine.colors.gray[2],
      backgroundColor: mantine.colors.gray[2],
    },
    [`${whereLight} ${whereNotReducedGraphics} &`]: {
      backgroundColor: `color-mix(in srgb, ${mantine.colors.gray[2]}, transparent 20%)`,
    },
    [`${whereDark} &`]: {
      color: mantine.colors.dark[0],
      borderColor: mantine.colors.dark[7],
      backgroundColor: mantine.colors.dark[8],
    },
  },
})
