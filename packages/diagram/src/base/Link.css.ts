import { style } from '@vanilla-extract/css'
import { mantine } from '../theme-vars'
import { easings, whereDark } from '../theme-vars.css'

export const elementLink = style({
  display: 'flex',
  overflow: 'hidden',
  alignItems: 'center',
  gap: 3,
  justifyContent: 'stretch',
  // transition: transitions.fast,
  border: `1px dashed ${mantine.colors.defaultBorder}`,
  borderRadius: mantine.radius.sm,
  minHeight: 30,
  padding: '3px 16px 3px 3px',
  cursor: 'pointer',
  color: mantine.colors.gray[7],
  ':hover': {
    // transitionTimingFunction: easings.out,
    borderStyle: 'solid',
    color: mantine.colors.defaultColor,
    background: mantine.colors.defaultHover,
  },
  selectors: {
    [`${whereDark} &`]: {
      color: mantine.colors.dark[1],
    },
    [`&[data-size='sm']`]: {
      minHeight: 22,
      padding: '2px 8px 2px 2px',
    },
  },
})

export const linkIcon = style({
  flex: 0,
})

export const linkTitleBox = style({
  flex: '1 1 100%',
  transition: `transform 130ms ${easings.inOut}`,
  selectors: {
    [`${elementLink}:hover &`]: {
      transitionTimingFunction: easings.out,
      transitionDelay: '50ms',
      transform: 'translateX(1px)',
    },
  },
})
