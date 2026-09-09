import { css } from '@likec4/styles/css'

export const treeNodeLabel = css({
  marginTop: 'sm',
  marginBottom: 'sm',
})

export const elementLabel = css({
  display: 'inline-flex',
  transition: 'fast',
  border: 'default',
  borderStyle: 'dashed',
  borderRadius: 'sm',
  px: 'md',
  py: 'xs',
  alignItems: 'center',
  cursor: 'pointer',
  color: 'mantine.gray[7]',

  _dark: {
    color: 'mantine.dark[1]',
  },
  '& > *': {
    transition: 'fast',
  },
  _hover: {
    transitionTimingFunction: 'out',
    borderStyle: 'solid',
    color: 'text.default',
    background: 'surface.hover',
  },
})
