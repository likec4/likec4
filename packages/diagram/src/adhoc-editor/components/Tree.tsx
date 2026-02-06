import { type RecipeVariantProps, css, cva, cx, sva } from '@likec4/styles/css'
import { createStyleContext } from '@likec4/styles/jsx'
import { IconChevronRight } from '@tabler/icons-react'
import type { MouseEventHandler, PropsWithChildren } from 'react'
import { IconOrShapeRenderer } from '../../context/IconRenderer'
import type { TreeNodeData } from '../useElementsTree'

// const shouldForwardProp = (prop: string, variantKeys: string[]): boolean =>
//   !variantKeys.includes(prop) && (isValidMotionProp(prop) || !isCssProperty(prop))

const statebtn = cva({
  base: {
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    justifySelf: 'flex-end',
    fontSize: '[8px]',
    fontFamily: 'mono',
    fontWeight: 'bold',
    letterSpacing: '[0.5px]',
    marginLeft: '2',
    // marginRight: '[calc((var(--depth, 1) - 1) * {spacing.4.5} + {spacing.2})]',
    py: '1',
    px: '1.5',
    lineHeight: '1',
    rounded: 'sm',
    minWidth: 32,
    transition: 'normal',
    _hover: {
      color: 'text.bright',
    },
  },
  variants: {
    state: {
      // 'include-explicit' | 'include-implicit' | 'exclude' | 'disabled' | 'not-present'
      ['include-explicit']: {
        backgroundColor: 'grass.6',
        color: 'text',
        // color: 'grass.0',
      },
      ['include-implicit']: {
        backgroundColor: 'grass.6',
        color: 'text',
        // color: 'grass.0',
      },
      exclude: {
        backgroundColor: 'red.6',
        color: 'text',
      },
      ['disabled']: {
        // backgroundColor: 'default.disabled',
        color: 'text.dimmed',
      },
      'not-present': {
        color: 'text.dimmed',
        backgroundColor: 'default.hover/50',
      },
    },
  },
  defaultVariants: {
    state: 'not-present',
  },
})

const icon = css.raw({
  flex: 0,
  display: 'flex',
  alignItems: 'center',

  color: 'text.dimmed',
  //   _groupFocus: 'inherit',
  //   _groupHover: 'inherit',
  // },
  _groupHover: {
    color: 'text',
  },
  _groupFocusWithin: {
    color: 'mantine.colors.primary.lightColor!',
  },
  _groupFocusVisible: {
    color: 'mantine.colors.primary.lightColor!',
  },

  '& :where(.likec4-shape-icon, .likec4-element-icon)': {
    display: 'contents',
  },

  '& :where(svg, img)': {
    width: '10px',
    height: '10px',
  },
  '@/md': {
    '& :where(svg, img)': {
      width: '14px',
      height: '14px',
    },
  },
  '@/lg': {
    '& :where(svg, img)': {
      width: '16px',
      height: '16px',
    },
  },

  opacity: {
    base: 0.8,
    _groupFocusVisible: 1,
    _groupHover: 1,
  },
})

const control = css.raw({
  paddingLeft: '[calc((var(--depth, 1) - 1) * {spacing.2} + {spacing.1})]',
  px: '1',
  py: '1',
  mb: '0',
  columnGap: '1',
  '@/md': {
    paddingLeft: '[calc((var(--depth, 1) - 1) * {spacing.2} + {spacing.2})]',
    px: '2',
    py: '1.5',
    mb: '0.5',
    columnGap: '2',
  },
  '@/lg': {
    paddingLeft: '[calc((var(--depth, 1) - 1) * {spacing.3} + {spacing.2.5})]',
    py: '2.5',
  },
  cursor: 'pointer',
  border: 'none',
  appearance: 'none',
  width: 'full',
  alignItems: 'center',
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto',
  gridTemplateRows: 'auto auto',
  rounded: 'sm',

  backgroundColor: {
    base: 'transparent',
    _hover: {
      base: 'mantine.colors.gray[1]',
      _dark: 'mantine.colors.dark[5]',
    },
    _focusWithin: 'mantine.colors.primary.lightHover!',
    _focusVisible: 'mantine.colors.primary.lightHover!',
  },
  color: {
    base: 'text',
    _hover: 'text.bright',
    _focusWithin: 'mantine.colors.primary.lightColor!',
    _focusVisible: 'mantine.colors.primary.lightColor!',
  },
  // _hover: {
  //   backgroundColor: {
  //     base: 'mantine.colors.gray[1]',
  //     _dark: 'mantine.colors.dark[5]',
  //   },
  // },
  _focusVisible: {
    outline: 'none',
    // backgroundColor: 'mantine.colors.primary.lightHover!',
  },
})

const tree = sva({
  slots: [
    'branch',
    'item', // leaf
    'control', // branch control
    'state', // chip
    'icon',
    'label',
    'content', // branch content
    'indicator', // branch indicator
  ],
  base: {
    branch: {},
    item: {
      ...control,
    },
    control: {
      ...control,
    },
    state: {
      border: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      justifySelf: 'flex-end',
      marginLeft: '2',
      // marginRight: '[calc((var(--depth, 1) - 1) * {spacing.4.5} + {spacing.2})]',
      '--chip-fz': '9px',
      '--chip-checked-padding': '{spacing.1}',
      '--chip-padding': '{spacing.1}',
      '--chip-spacing': '0',
      '--chip-size': '16px',
      // '& label': {
      //   color: 'text',
      //   _groupFocusVisible: {
      //     backgroundColor: 'mantine.colors.primary.lightHover!',
      //   },
      //   // backgroundColor: 'transparent',
      // },
      transition: 'opacity 150ms ease-out',
      // opacity: {
      //   base: 0.4,
      //   _checked: 1,
      //   _groupFocusVisible: 1,
      //   _groupHover: 1,
      // },
    },
    icon: {
      ...icon,
    },
    label: {
      cursor: 'inherit',
      color: 'inherit',
      userSelect: 'none',
      textStyle: 'xxs',
      truncate: 'ellipsis',
      '@/sm': {
        textStyle: 'xs',
      },
      '@/md': {
        textStyle: 'sm',
      },
      fontWeight: '[450]',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '2',
    },
    indicator: {
      color: 'inherit',
      transition: 'transform 150ms ease-out',
      width: '12px',
      opacity: 0.75,
      '@/md': {
        width: '14px',
      },
      _open: {
        transform: 'rotate(90deg)',
      },
    },
    content: {},
  },
  variants: {},
  defaultVariants: {},
})

export type TreeVariants = RecipeVariantProps<typeof tree>

const { withRootProvider, withContext } = createStyleContext(tree)

const Root = withRootProvider('div')

const Branch = withContext('div', 'branch')

const Item = withContext('div', 'item', {
  forwardProps: [],
  defaultProps: {
    className: 'group',
  },
})

const Control = withContext('div', 'control', {
  forwardProps: [],
  defaultProps: {
    className: 'group',
  },
})

const ElementState = ({ node, state, onClick, className, ...props }: PropsWithChildren<
  RecipeVariantProps<typeof statebtn> & {
    node: TreeNodeData
    className?: string
    onClick?: MouseEventHandler<HTMLElement>
  }
>) => {
  const cls = cx(
    className,
    'mantine-active',
    statebtn({ state }),
  )

  return (
    <div {...props} onClick={onClick} className={cls}>
      {state}
    </div>
  )
}
const State = withContext(ElementState, 'state', {
  forwardProps: ['node', 'state', 'onClick', 'className'],
}) as unknown as typeof ElementState

const Icon = withContext(IconOrShapeRenderer, 'icon', {
  forwardProps: ['element', 'className'],
}) as unknown as typeof IconOrShapeRenderer

const Label = withContext('div', 'label', {
  forwardProps: [],
})
const Content = withContext('div', 'content', {
  forwardProps: [],
})
const Indicator = withContext(IconChevronRight, 'indicator', {
  forwardProps: [],
  defaultProps: {
    size: 14,
  },
})

export const Tree = {
  Root,
  Branch,
  Item,
  Control,
  State,
  Icon,
  Label,
  Content,
  Indicator,
}
