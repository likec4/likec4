import { css, cx } from '@likec4/styles/css'

export { focusable } from './_shared.css'

const _viewBtn = 'likec4-view-btn'

export const viewButton = cx(
  css({
    flexWrap: 'nowrap',
    display: 'flex',
    // '& .mantine-ThemeIcon-root': {
    //   color: `[var(${iconColor}, {colors.mantine.dark[2]})]`,
    //   '--ti-size': '24px',
    // },
    '&[data-disabled] .mantine-ThemeIcon-root': {
      opacity: '0.45',
    },
  }),
  _viewBtn,
)
