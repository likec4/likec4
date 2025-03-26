import { css as style } from '@likec4/styles/css'
// import { createVar, fallbackVar, globalStyle, style } from '@vanilla-extract/css'
// import { mantine, transitions, vars, whereDark, whereLight, whereNotReducedGraphics } from '../theme-vars'

// const transparent = createVar('transparent')
// const bgColor = createVar('bgcolor')
export const root = style({
  height: '30px',
  paddingLeft: 'sm',
  paddingRight: '4px',
  borderRadius: 'sm',
  // TODO
  // color: fallbackVar('var(--search-color)', 'mantine.colors.placeholder)',
  border: '1px solid',
  borderColor: {
    base: 'mantine.colors.defaultBorder',
    _light: 'mantine.colors.gray[4]',
    _dark: 'mantine.colors.dark[4]',
    _hover: 'mantine.colors.defaultBorder',
  },
  cursor: 'pointer',
  background: {
    base: 'mantine.colors.default',
    _light: 'mantine.colors.white',
    _dark: 'mantine.colors.dark[6]',
    _hover: 'mantine.colors.defaultHover',
  },

  width: '100%',
  '& .tabler-icon': {
    color: 'mantine.colors.text',
  },

  transition: {
    base: 'fast',
    _whenPanning: 'none !important',
  },
  boxShadow: {
    base: 'xs',
    _hover: 'sm',
    _whenPanning: 'none !important',
  },
})

export const placeholder = style({
  fontSize: 'sm', // mantine.fontSizes.sm,
  fontWeight: 500,
  paddingRight: '50px',
  color: 'mantine.colors.placeholder',
  flex: '1',
})

export const shortcut = style({
  fontSize: '11px',
  fontWeight: 600,
  lineHeight: 1,
  padding: '4px 7px',
  borderRadius: 'sm',
  border: '1px solid',
  transition: 'fast',
  _light: {
    color: 'mantine.colors.gray[7]',
    borderColor: 'mantine.colors.gray[2]',
  },
  _dark: {
    color: 'mantine.colors.dark[0]',
    borderColor: 'mantine.colors.dark[7]',
  },
  backgroundColor: {
    _light: 'mantine.colors.gray[2]/70',
    _dark: 'mantine.colors.dark[8]/70',
    _groupHover: {
      _light: 'mantine.colors.gray[2]',
      _dark: 'mantine.colors.dark[8]',
    },
  },
})
