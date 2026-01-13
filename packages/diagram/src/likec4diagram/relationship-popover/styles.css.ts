import { css } from '@likec4/styles/css'

export const endpoint = css({
  display: 'block',
  fontSize: 'xxs',
  fontWeight: 'medium',
  whiteSpace: 'nowrap',
  paddingX: '1',
  paddingY: '0.5',
  borderRadius: '[2px]',
  background: {
    _light: 'var(--likec4-palette-fill)/90',
    _dark: 'var(--likec4-palette-fill)/60',
  },
  lineHeight: '1',
  color: {
    _light: 'var(--likec4-palette-hiContrast)',
    _dark: 'var(--likec4-palette-loContrast)',
  },
})

export const title = css({
  whiteSpaceCollapse: 'preserve-breaks',
  fontSize: 'sm',
  lineHeight: 'sm',
  userSelect: 'all',
})
