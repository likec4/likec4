import { fallbackVar, globalStyle, style } from '@vanilla-extract/css'
import { mantine } from '../../../theme-vars'
import { button, description, descriptionColor, iconColor, title } from './_shared.css'

export { emptyBoX, focusable } from './_shared.css'

export const viewButton = style([button, {
  flexWrap: 'nowrap',
  display: 'flex',
}])

globalStyle(`${viewButton} .mantine-ThemeIcon-root`, {
  // transition: transitions.fast,
  color: fallbackVar(iconColor, mantine.colors.dark[2]),
  vars: {
    '--ti-size': '24px',
  },
})
globalStyle(`${viewButton}[data-disabled] .mantine-ThemeIcon-root`, {
  opacity: 0.45,
})

export const viewTitle = style([title])
export const viewDescription = style([description])

export const viewButtonDescription = style({
  marginTop: 4,
  // transition: transitions.fast,
  color: fallbackVar(descriptionColor, mantine.colors.dimmed),
  fontSize: 13,
  lineHeight: 1.4,
  selectors: {
    [`:where(${viewButton}[data-disabled]) &`]: {
      opacity: 0.85,
    },
  },
})
