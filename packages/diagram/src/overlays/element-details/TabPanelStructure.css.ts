import { css } from '@likec4/styles/css'

export const treeNodeLabel = css({
  marginTop: 'sm',
  marginBottom: 'sm',
})

export const elementLabel = css({
  display: 'inline-flex',
  transition: 'fast',
  border: `1px dashed`,
  borderColor: 'default.border',
  borderRadius: 'sm',
  px: 'md',
  py: 'xs',
  alignItems: 'center',
  cursor: 'pointer',
  color: 'mantine.colors.gray[7]',

  _dark: {
    color: 'mantine.colors.dark[1]',
  },
  '& > *': {
    transition: 'fast',
  },
  _hover: {
    transitionTimingFunction: 'out',
    borderStyle: 'solid',
    color: 'default.color',
    background: 'default.hover',
    '& > *': {
      transitionTimingFunction: 'out',
      transform: 'translateX(1px)',
    },
  },
})
