import { css, cx } from '@likec4/styles/css'

// import { fallbackVar, globalStyle, style } from '@vanilla-extract/css'
// import { mantine } from '../../../theme-vars'
import { button, description, descriptionColor, iconColor, title } from './_shared.css'

export { emptyBoX, focusable } from './_shared.css'

const _viewBtn = 'likec4-view-btn'

export const viewButton = cx(
  css(button, {
    flexWrap: 'nowrap',
    display: 'flex',
    '& .mantine-ThemeIcon-root': {
      color: `[var(${iconColor}, {colors.mantine.colors.dark[2]})]`,
      '--ti-size': '24px',
    },
    '&[data-disabled] .mantine-ThemeIcon-root': {
      opacity: 0.45,
    },
  }),
  _viewBtn,
)

export const viewTitle = css(title)
export const viewDescription = css(description)

export const viewButtonDescription = css({
  marginTop: '4px',
  // transition: transitions.fast,
  color: `[var(${descriptionColor}, {colors.mantine.colors.dimmed})]`,
  fontSize: '13px',
  lineHeight: '1.4',
  [`:where(.likec4-view-btn[data-disabled]) &`]: {
    opacity: 0.85,
  },
})
