import { css } from '@likec4/styles/css'

export const navsidebar = css({
  backdropFilter: '[blur(6px)]',
  transitionProperty: 'common',
  transition: 'slow',
  transform: 'translateX(-100%)',
  _before: {
    transitionProperty: 'common',
    transition: 'slow',
    position: 'absolute',
    content: '" "',
    inset: '0',
    background: 'mantine.gray[7]',
    opacity: '0.7',
    zIndex: '[1]',
  },
  '& > div': {
    position: 'relative',
    zIndex: '[2]',
  },
  '&[data-opened=\'true\']': {
    transform: 'translateX(0)',
  },
})

export const trigger = css({
  cursor: 'pointer',
  _before: {
    transitionProperty: 'common',
    transitionTimingFunction: '[cubic-bezier(0,0.31,0,1.03)]',
    transitionDuration: 'fast',
    position: 'absolute',
    content: '',
    inset: '0',
    background: 'mantine.gray[7]',
    opacity: '0',
    zIndex: '[1]',
  },
  '& > *': {
    position: 'relative',
    zIndex: '[2]',
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
