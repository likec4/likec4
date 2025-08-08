import { css } from '@likec4/styles/css'

export const container = css({
  bottom: '0',
  right: '0',
  padding: '2',
  margin: '0',
})

export const icon = css({
  ['--ai-radius']: '0px',
  _noReduceGraphics: {
    ['--ai-radius']: '{radii.md}',
  },
})

export const card = css({
  cursor: 'default',
  userSelect: 'none',
  minWidth: 200,
  maxWidth: 'calc(100vw - 20px)',
  backgroundColor: `mantine.colors.body/80`,
  // WebkitBackdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(8px)'),
  // backdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(8px)'),
  sm: {
    minWidth: 300,
    maxWidth: `65vw`,
  },
  md: {
    maxWidth: `40vw`,
  },
  _dark: {
    backgroundColor: `mantine.colors.dark[6]/80`,
  },
})

export const tabPanel = css({
  padding: 'xxs',
})

// export const description = css({
//   whiteSpaceCollapse: 'preserve-breaks',
//   color: mantine.colors.gray[7],
//   selectors: {
//     [`${whereDark} &`]: {
//       color: mantine.colors.gray[5]
//     }
//   }
// })

export const elementNotation = css({
  backgroundColor: 'transparent',
  transition: 'all 100ms ease-in',
  // WebkitBackdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(8px)'),
  // backdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(8px)'),
  // vars: {
  //   // [stokeFillMix]: `color-mix(in srgb, ${vars.element.stroke} 90%, ${vars.element.fill})`
  // },
  _hover: {
    transition: 'all 120ms ease-out',
    // backgroundColor:
    backgroundColor: `mantine.colors.primary[2]/50`,
  },
  _dark: {
    _hover: {
      backgroundColor: `mantine.colors.dark[3]/40`,
    },
  },
})

export const shapeSvg = css({
  fill: 'var(--likec4-palette-fill)',
  stroke: 'var(--likec4-palette-stroke)',
  strokeWidth: 1,
  overflow: 'visible',
  width: '100%',
  height: 'auto',
  filter: `
    drop-shadow(0 2px 3px rgb(0 0 0 / 22%))
    drop-shadow(0 1px 8px rgb(0 0 0 / 10%))
  `,
})

export const shapeBadge = css({
  fontWeight: 500,
  letterSpacing: '0.2px',
  paddingTop: '0',
  paddingBottom: '0',
  textTransform: 'lowercase',
  transition: 'all 150ms ease-in-out',
  cursor: 'pointer',
  ['--badge-radius']: '2px',
  ['--badge-fz']: '9.5px',
  ['--badge-padding-x']: '3px',
  ['--badge-height']: '13.5px',
  ['--badge-lh']: '1',
  ['--badge-bg']: 'var(--likec4-palette-fill)',
  ['--badge-color']: 'var(--likec4-palette-hiContrast)',
})
