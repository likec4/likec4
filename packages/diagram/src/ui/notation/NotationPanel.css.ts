import { fallbackVar, globalStyle, style } from '@vanilla-extract/css'
import { calc } from '@vanilla-extract/css-utils'
import { mantine, whereDark } from '../../mantine.css'
import { vars } from '../../theme.css'
import { stokeFillMix } from '../../xyflow/nodes/element/element.css'

export const container = style({
  bottom: 0,
  right: 0,
  padding: 8,
  margin: 0
})

export const card = style({
  cursor: 'default',
  userSelect: 'none',
  minWidth: 200,
  maxWidth: 'calc(100vw - 20px)',
  backgroundColor: `color-mix(in srgb, ${mantine.colors.body}, transparent 20%)`,
  WebkitBackdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(8px)'),
  backdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(8px)'),
  '@media': {
    [mantine.largerThan('sm')]: {
      minWidth: 300,
      maxWidth: `65vw`
    },
    [mantine.largerThan('md')]: {
      // minWidth: 350,
      maxWidth: `40vw`
    }
  },
  selectors: {
    [`${whereDark} &`]: {
      backgroundColor: `color-mix(in srgb, ${mantine.colors.dark[6]}, transparent 20%)`
    }
  }
})

export const tabPanel = style({
  padding: calc(mantine.spacing.xs).divide(2).toString()
})

// export const description = style({
//   whiteSpaceCollapse: 'preserve-breaks',
//   color: mantine.colors.gray[7],
//   selectors: {
//     [`${whereDark} &`]: {
//       color: mantine.colors.gray[5]
//     }
//   }
// })

export const elementNotation = style({
  backgroundColor: 'transparent',
  transition: 'all 100ms ease-in',
  // WebkitBackdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(8px)'),
  // backdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(8px)'),
  vars: {
    [stokeFillMix]: `color-mix(in srgb, ${vars.element.stroke} 90%, ${vars.element.fill})`
  },
  ':hover': {
    transition: 'all 120ms ease-out',
    // backgroundColor:
    backgroundColor: `color-mix(in srgb, ${mantine.colors.primaryColors[2]}, transparent 50%)`
  },
  selectors: {
    [`${whereDark} &:hover`]: {
      backgroundColor: `color-mix(in srgb, ${mantine.colors.dark[3]}, transparent 60%)`
    }
  }
})

export const shapeSvg = style({
  fill: vars.element.fill,
  stroke: vars.element.stroke,
  strokeWidth: 1,
  overflow: 'visible',
  width: '100%',
  height: 'auto',
  filter: `
    drop-shadow(0 2px 3px rgb(0 0 0 / 22%))
    drop-shadow(0 1px 8px rgb(0 0 0 / 10%))
  `
})

export const shapeBadge = style({
  fontWeight: 500,
  letterSpacing: '0.2px',
  paddingTop: 0,
  paddingBottom: 0,
  textTransform: 'lowercase',
  transition: 'all 150ms ease-in-out',
  cursor: 'pointer',
  vars: {
    ['--badge-radius']: '2px',
    ['--badge-fz']: '9.5px',
    ['--badge-padding-x']: '3px',
    ['--badge-height']: '13.5px',
    ['--badge-lh']: '1'
    // ['--badge-bg']: vars.element.fill,
    // ['--badge-color']: vars.element.hiContrast
  }
})
