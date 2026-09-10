import { css } from '@likec4/styles/css'

export const root = css({
  height: 'control.sm',
  paddingLeft: 'sm',
  paddingRight: '1',
  borderRadius: 'sm',
  // TODO
  // color: fallbackVar('var(--search-color)', 'mantine.placeholder)',
  border: 'default',
  borderColor: {
    base: 'border.default',
    _light: 'mantine.gray[4]',
    _dark: 'mantine.dark[4]',
    _hover: 'border.default',
  },
  cursor: 'pointer',
  background: {
    base: 'surface.default',
    _hover: 'surface.hover',
  },

  width: '100%',
  '& .tabler-icon': {
    color: 'text',
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

export const placeholder = css({
  fontSize: 'sm', // mantine.fontSizes.sm,
  fontWeight: 'medium',
  paddingRight: '2.5', // 10px
  color: 'text.non-essential',
  flex: '1',
  sm: {
    paddingRight: '[30px]',
  },
  md: {
    paddingRight: '[50px]',
  },
})

export const shortcut = css({
  fontSize: 'xxs',
  fontWeight: 'bold',
  lineHeight: 'tight',
  padding: '[4px 7px]',
  borderRadius: 'sm',
  border: 'default',
  transition: 'fast',
  _light: {
    color: 'mantine.gray[7]',
    borderColor: 'mantine.gray[2]',
  },
  _dark: {
    color: 'mantine.dark[0]',
    borderColor: 'mantine.dark[7]',
  },
  backgroundColor: {
    _light: 'mantine.gray[2]/70',
    _dark: 'mantine.dark[8]/70',
    _groupHover: {
      _light: 'mantine.gray[2]',
      _dark: 'mantine.dark[8]',
    },
  },
})
