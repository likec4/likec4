import { css as style } from '@likec4/styles/css'
// import { createVar, fallbackVar, globalStyle, style } from '@vanilla-extract/css'
// import { mantine, transitions, vars, whereDark, whereLight, whereNotReducedGraphics } from '../theme-vars'

// const transparent = createVar('transparent')
// const bgColor = createVar('bgcolor')
export const root = style({
  height: '30px',
  paddingLeft: 'sm',
  paddingRight: '4px',
  borderRadius: '0px',
  // TODO
  // color: fallbackVar('var(--search-color)', 'mantine.colors.placeholder)',
  border: '1px solid',
  cursor: 'pointer',
  background: 'mantine.colors.default',
  width: '100%',
  // vars: {
  //   [transparent]: '20%',
  //   [bgColor]: 'mantine.colors.default',
  // },
  _light: {
    borderColor: 'mantine.colors.gray[4]',
    background: 'mantine.colors.white',
  },
  _dark: {
    borderColor: 'mantine.colors.dark[4]',
    background: 'mantine.colors.dark[6]',
  },
  _notReducedGraphics: {
    transition: 'fast',
    borderRadius: 'sm',
    shadow: 'xs',
    // backgroundColor: `color-mix(in srgb, ${bgColor}, transparent ${transparent})`,
    // WebkitBackdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(8px)'),
    // backdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(8px)'),
  },
  _hover: {
    borderColor: 'mantine.colors.defaultBorder',
    shadow: 'sm',
    background: 'mantine.colors.defaultHover',
    // vars: {
    //   [transparent]: '10%',
    //   [bgColor]: 'mantine.colors.defaultHover',
    // },
  },
  '& .tabler-icon': {
    color: 'mantine.colors.text',
  },
})

export const placeholder = style({
  fontSize: 'sm', // mantine.fontSizes.sm,
  fontWeight: 500,
  paddingRight: 50,
  flex: 1,
})

export const shortcut = style({
  fontSize: '11px',
  fontWeight: 600,
  lineHeight: 1,
  padding: '4px 7px',
  borderRadius: 'sm',
  border: '1px solid',
  _light: {
    color: 'mantine.colors.gray[7]',
    borderColor: 'mantine.colors.gray[2]',
    backgroundColor: 'mantine.colors.gray[2]',
    _notReducedGraphics: {
      // backgroundColor: `color-mix(in srgb, ${'mantine.colors.gray[2]}, transparent 20%)`',
    },
  },
  _dark: {
    color: 'mantine.colors.dark[0]',
    borderColor: 'mantine.colors.dark[7]',
    backgroundColor: 'mantine.colors.dark[8]',
  },
})
