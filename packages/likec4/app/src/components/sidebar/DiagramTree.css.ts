// import { style } from '@vanilla-extract/css'
import { css } from '@likec4/styles/css'

export const navsidebar = css({
  backdropFilter: 'blur(6px)',
  transition: 'transform 0.21s cubic-bezier(0.4,0,0.2,1)',
  transform: 'translateX(-100%)',
  _before: {
    transition: 'all 0.26s ease-in-out',
    position: 'absolute',
    content: '" "',
    inset: '0',
    background: 'mantine.colors.gray[7]',
    opacity: '0.7',
    zIndex: '1',
  },
  '& > div': {
    position: 'relative',
    zIndex: '2',
  },
  '&[data-opened=\'true\']': {
    transform: 'translateX(0)',
  },
})

export const trigger = css({
  cursor: 'pointer',
  _before: {
    transitionProperty: 'all',
    transitionTimingFunction: 'cubic-bezier(0,0.31,0,1.03)',
    transitionDuration: '140ms',
    position: 'absolute',
    content: '',
    inset: '0',
    background: 'mantine.colors.gray[7]',
    opacity: '0',
    zIndex: '1',
  },
  '& > *': {
    position: 'relative',
    zIndex: '2',
  },
  '&:hover::before': {
    visibility: 'visible',
    opacity: '0.7',
  },
  '&[data-opened=\'true\']': {
    visibility: 'hidden',
  },
})

export const diagramPreview = css({
  pointerEvents: 'none',
})
