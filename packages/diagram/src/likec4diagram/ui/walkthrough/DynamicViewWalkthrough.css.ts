import { css } from '@likec4/styles/css'
import type { SystemStyleObject } from '@likec4/styles/types'

export const container = css({
  position: 'absolute',
  bottom: '0.5rem',
  left: '50%',
  transform: 'translateX(-50%)',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
  alignItems: 'center',
  md: {
    gap: '0.6rem',
  },
})

const tablerIcons = {
  '& .tabler-icon': {
    width: '0.85em',
    height: '0.85em',
  },
} satisfies SystemStyleObject

export const buttons = css({
  backdropFilter: 'blur(8px)',
  transition: 'all 175ms ease-in',
  _hover: {
    transitionTimingFunction: 'ease-out',
    transform: 'scale(1.1)',
  },
  _active: {
    transitionDuration: '100ms',
    transform: 'scale(0.98) translateY(3px)',
  },
  ...tablerIcons,
})

const transparency = '--transparency'
export const btn = css({
  transition: 'all 175ms ease-in',
  backgroundColor: '[var(--button-bg)]',
  [transparency]: '35%',
  _light: {
    [transparency]: '15%',
  },
  ['--button-bg']: `color-mix(in srgb, {colors.mantine.colors.primary.filled}, transparent var(${transparency}))`,
  ['--button-hover']:
    `color-mix(in srgb, {colors.mantine.colors.primary.filledHover}, transparent var(${transparency}))`,
  ...tablerIcons,
})

export const parallelStateFrame = css({
  position: 'absolute',
  margin: 0,
  padding: 0,
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  border: `2px solid`,
  borderColor: 'mantine.colors.orange[6]',
  pointerEvents: 'none',
  md: {
    borderWidth: 4,
  },
})
