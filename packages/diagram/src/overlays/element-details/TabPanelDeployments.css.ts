import { css, cx } from '@likec4/styles/css'

export const treeNode = css({
  [`&[data-level='1']`]: {
    marginBottom: 'sm',
  },
})

export const treeNodeLabel = css({
  cursor: 'default',
  marginTop: 0,
  marginBottom: 0,
})

const label = css({
  transition: 'fast',
  color: 'mantine.colors.gray[7]',
  _dark: {
    color: 'mantine.colors.dark[1]',
  },
  '& > *': {
    transition: 'fast',
  },
  _hover: {
    transitionTimingFunction: 'out',
    '& > :not([data-no-transform])': {
      transitionTimingFunction: 'out',
      transform: 'translateX(1px)',
    },
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
    height: '36px',
    paddingInlineStart: '16px',
    paddingInlineEnd: '10px',
    borderRadius: 'sm',
    alignItems: 'center',
    color: 'mantine.colors.gray[7]',
    _dark: {
      color: 'mantine.colors.gray.lightColor',
    },
    _hover: {
      background: 'mantine.colors.gray.lightHover',
    },
    '& .tabler-icon': {
      transition: 'fast',
      width: '90%',
      opacity: 0.65,
    },
  }),
)
