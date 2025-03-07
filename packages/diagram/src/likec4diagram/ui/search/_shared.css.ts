import { type StyleRule, createVar, fallbackVar, style } from '@vanilla-extract/css'
import { mantine, whereDark, whereLight } from '../../../theme-vars'

export const titleColor = createVar('title-color')
export const descriptionColor = createVar('description-color')
export const iconColor = createVar('icon-color')

export const buttonFocused = {
  outline: 'none',
  backgroundColor: mantine.colors.primaryColors[8],
  borderColor: mantine.colors.primaryColors[9],
  vars: {
    [iconColor]: mantine.colors.primaryColors[2],
    [titleColor]: mantine.colors.primaryColors[0],
    [descriptionColor]: mantine.colors.primaryColors[1],
  },
} satisfies StyleRule

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
  ':hover': {
    ...buttonFocused,
    borderColor: mantine.colors.primaryColors[9],
    backgroundColor: `color-mix(in srgb, ${buttonFocused.backgroundColor}, transparent 40%)`,
  },
  ':focus': buttonFocused,
  selectors: {
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
    [`${whereLight} &:hover`]: {
      borderColor: mantine.colors.primaryColors[6],
      backgroundColor: mantine.colors.primaryColors[5],
      vars: {
        [iconColor]: mantine.colors.primaryColors[3],
        [titleColor]: mantine.colors.primaryColors[0],
        [descriptionColor]: mantine.colors.primaryColors[1],
      },
    },
  },
})

export const focusable = style({})

export const title = style({
  color: fallbackVar(titleColor, mantine.colors.gray[7]),
  fontSize: 16,
  fontWeight: 500,
  lineHeight: 1.1,
  selectors: {
    [`:where([data-disabled]) &`]: {
      opacity: 0.4,
    },
  },
})
export const description = style({
  marginTop: 4,
  color: fallbackVar(descriptionColor, mantine.colors.dimmed),
  fontSize: 12,
  lineHeight: 1.4,
  selectors: {
    [`:where([data-disabled]) &`]: {
      opacity: 0.85,
    },
  },
})

export const emptyBoX = style({
  width: '100%',
  height: '100%',
  border: `2px dashed ${mantine.colors.defaultBorder}`,
  borderRadius: mantine.radius.md,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: mantine.fontSizes.md,
  color: mantine.colors.dimmed,
  padding: mantine.spacing.md,
  paddingBlock: mantine.spacing.xl,
})
