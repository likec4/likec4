import { type StyleRule, createVar, fallbackVar, style } from '@vanilla-extract/css'
import { mantine } from '../../../theme-vars'
import { whereDark, whereLight } from '../../../theme-vars.css'

export const titleColor = createVar('title-color')
export const descriptionColor = createVar('description-color')
export const iconColor = createVar('icon-color')

export const buttonFocused: StyleRule = {
  outline: 'none',
  backgroundColor: `color-mix(in srgb, ${mantine.colors.primaryColors[8]}, transparent 10%)`,
  borderColor: mantine.colors.primaryColors[8],
  vars: {
    [iconColor]: mantine.colors.primaryColors[2],
    [titleColor]: mantine.colors.primaryColors[0],
    [descriptionColor]: mantine.colors.primaryColors[1],
  },
}

export const button = style({
  display: 'flex',
  width: '100%',
  background: mantine.colors.body,
  borderRadius: mantine.radius.sm,
  padding: `12px 8px 12px 14px`,
  minHeight: 60,
  gap: 10,
  // alignItems: 'flex-start',
  // transition: `all 50ms ${easings.inOut}`,
  border: `1px solid ${mantine.colors.defaultBorder}`,
  vars: {
    [titleColor]: mantine.colors.dark[1],
    [iconColor]: mantine.colors.dimmed,
    [descriptionColor]: mantine.colors.dimmed,
  },
  ':focus': buttonFocused,
  selectors: {
    [`&:hover:not([data-disabled])`]: {
      ...buttonFocused,
      backgroundColor: mantine.colors.primaryColors[7],
    },
    [`${whereDark} &`]: {
      borderColor: 'transparent',
      backgroundColor: `color-mix(in srgb, ${mantine.colors.dark[6]}, transparent 20%)`,
      // background: mantine.colors.dark[6],
    },
    [`${whereLight} &`]: {
      backgroundColor: `color-mix(in srgb, ${mantine.colors.white}, transparent 10%)`,
      vars: {
        [iconColor]: mantine.colors.gray[6],
        [titleColor]: mantine.colors.gray[7],
      },
    },
    [`${whereDark} &:hover`]: {
      borderColor: 'transparent',
      // vars: {
      //   [iconColor]: mantine.colors.gray[7],
      // },
    },
    // [`&[data-disabled="true"]`]: {
    //   vars: {
    //     [titleColor]: mantine.colors.dimmed
    //   },
    // },
    // [`[data-likec4-views]:not(:focus-within) &:hover`]: onhover,
  },
})

export const focusable = style({})

export const title = style({
  color: fallbackVar(titleColor, mantine.colors.gray[7]),
  fontSize: 16,
  fontWeight: 500,
  lineHeight: 1.1,
  selectors: {
    [`:where(${button}[data-disabled]) &`]: {
      opacity: 0.4,
    },
  },
})
export const description = style({
  marginTop: 4,
  color: fallbackVar(descriptionColor, mantine.colors.dimmed),
  fontSize: 13,
  lineHeight: 1.4,
  selectors: {
    [`:where(${button}[data-disabled]) &`]: {
      opacity: 0.85,
    },
  },
})
