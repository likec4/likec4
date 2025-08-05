import { css } from '@likec4/styles/css'

export const menuDropdown = css({
  overflowY: 'scroll',
  minWidth: '250px',
  maxWidth: 'min(90vw, 500px)',
})

export const menuItemRelationship = css({
  gap: '1',
})

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
  // _dark: {
  //   background: `var(--likec4-palette-fill)/60`,
  // },
})

export const title = css({
  whiteSpaceCollapse: 'preserve-breaks',
  fontSize: 'xs',
})

export const arrowFromTo = css({
  whiteSpaceCollapse: 'preserve-breaks',
  fontSize: 'xs',
})
