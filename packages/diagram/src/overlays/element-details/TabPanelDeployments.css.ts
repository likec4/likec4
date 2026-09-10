import { css, cx } from '@likec4/styles/css'

export const treeNode = css({
  [`&[data-level='1']`]: {
    marginBottom: 'sm',
  },
})

export const treeNodeLabel = css({
  cursor: 'default',
  marginTop: '0',
  marginBottom: '0',
})

const label = css({
  transition: 'fast',
  color: 'mantine.gray[7]',
  _dark: {
    color: 'mantine.dark[1]',
  },
  '& > *': {
    transition: 'fast',
  },
  //   '.mantine-Button-root:hover & > :not([data-no-transform])': {
  // transitionTimingFunction: 'out',
  //   transform: 'translateX(1px)',
  //   },
})

export const nodeLabel = cx(label)

export const instanceLabel = cx(
  label,
  css({
    cursor: 'pointer',
    width: '100%',
    justifyContent: 'stretch',
    flexWrap: 'nowrap',
    height: '[36px]',
    paddingInlineStart: '[16px]',
    paddingInlineEnd: '2.5', // 10px
    borderRadius: 'sm',
    alignItems: 'center',
    color: 'text.default',
    _hover: {
      background: 'surface.hover',
    },
    '& .tabler-icon': {
      transition: 'fast',
      boxSize: '[90%]',
      opacity: '[0.65]',
    },
  }),
)
