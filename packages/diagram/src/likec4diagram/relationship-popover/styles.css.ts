import { css } from '@likec4/styles/css'

export const endpoint = css({
  display: 'block',
  fontSize: 'xxs',
  fontWeight: 500,
  whiteSpace: 'nowrap',
  padding: '[2px 4px]',
  borderRadius: '[2px]',
  background: `var(--likec4-palette-fill)/30`,
  lineHeight: '[1.11]',
  mixBlendMode: 'hard-light',
  color: {
    _light: `[color-mix(in srgb, var(--likec4-palette-stroke), {colors.likec4.mixColor} 60%)]`,
    _dark: 'var(--likec4-palette-loContrast)',
  },
})

export const title = css({
  whiteSpaceCollapse: 'preserve-breaks',
  fontSize: 'sm',
  lineHeight: 'sm',
})
