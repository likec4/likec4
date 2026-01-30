import { type RecipeVariantProps, sva } from '@likec4/styles/css'
import { createStyleContext } from '@likec4/styles/jsx'
import { Checkbox as MantineCheckbox } from '@mantine/core'
import { IconChevronRight } from '@tabler/icons-react'
import type { FC, HTMLAttributes } from 'react'

const branch = sva({
  slots: [
    'root',
    'control',
    'checkbox',
    'label',
    'description',
    'indentGuide',
    'content',
    'contentHeader',
    'indicator',
    'badge',
  ],
  base: {
    root: {
      mb: '1',
      // border: 'default',
      // borderColor: 'transparent',
      _expanded: {
        // background: 'main.light/70',
        pb: '1',
      },
      _focusVisible: {
        // background: 'main.light/70',
      },
      // '&:has([data-part="branch-control"]:hover)': {
      //   _expanded: {
      //     borderColor: 'main.filled/50',
      //   },
      // },
    },
    control: {
      pt: '2.5',
      p: '2',
      width: 'full',
      alignItems: 'center',
      outline: 'none',
      cursor: 'pointer',
      userSelect: 'none',
      display: 'grid',
      gridTemplateColumns: 'auto 1fr',
      gridTemplateRows: 'auto auto',
      columnGap: '2.5',
      rowGap: '1',
      transitionDuration: 'faster',
      transitionTimingFunction: 'inOut',
      background: {
        base: 'transparent',
        // _hover: 'main.lightHover',
        // [':is([aria-expanded="true"]) > &']: 'transparent~',
        // _focusVisible: 'main.filledHover!',
      },
      _focusVisible: {
        transitionDuration: 'fastest',
        // color: 'white',
      },
    },
    label: {
      textStyle: 'sm',
      lineHeight: 'md',
      fontWeight: 'medium',
      display: 'inline-flex',
      alignItems: 'center',
      cursor: 'inherit',
      gap: '1',
      gridRow: '1 / 2',
      gridColumn: '2 / 3',
    },
    description: {
      textStyle: 'xs',
      lineClamp: 2,
      gridRow: '2 / 3',
      gridColumn: '2 / 3',
      opacity: .7,
    },
    checkbox: {
      flex: 0,
      display: 'flex',
      alignItems: 'center',
      gridRow: '1 / 2',
      gridColumn: '1 / 2',
      _groupFocusVisible: {
        opacity: .85,
      },
      ['&:has([data-state="indeterminate"])']: {
        opacity: .85,
      },
    },
    indicator: {
      transition: 'transform 150ms ease-out',
      _open: {
        transform: 'rotate(90deg)',
      },
    },
    content: {},
    contentHeader: {
      my: '1',
      textStyle: 'dimmed.xxs',
      fontWeight: 'bolder',
      // color: 'dimmed',
      marginLeft: '[calc((var(--depth, 1)) * 22px + 12px)]',
    },
    badge: {
      display: 'contents',
    },
  },
  variants: {},
  defaultVariants: {},
})

const item = sva({
  slots: ['root', 'checkbox', 'label', 'description'],
  base: {
    root: {
      cursor: 'pointer',
      p: '2',
      rounded: 'sm',
      outline: 'none',
      display: 'grid',
      gridTemplateColumns: 'auto 1fr',
      gridTemplateRows: 'auto auto',
      columnGap: '2',
      rowGap: '0.5',
      alignItems: 'center',
      marginLeft: '[calc((var(--depth, 1) - 1) * 22px + 8px)]',
      mr: '1',
      transitionDuration: 'fastest',
      transitionTimingFunction: 'out',
      background: {
        base: 'transparent',
        // _hover: 'main.lightHover',
        // _focusVisible: 'main.filledHover!',
      },
      border: 'default',
      borderColor: {
        base: 'transparent',
        // _hover: 'main.filled/30',
      },
      _focusVisible: {
        transitionDuration: 'fastest',
        // color: 'white',
      },
      mb: '1',
    },
    label: {
      textStyle: 'sm',
      fontWeight: 'medium',
      gridRow: '1 / 2',
      gridColumn: '2 / 3',
      cursor: 'inherit',
      opacity: .8,
    },
    description: {
      textStyle: 'xs',
      opacity: .7,
      userSelect: 'none',
      // _groupFocusVisible: {
      //   color: 'white/85',
      // },
      lineClamp: 2,
      gridRow: '2 / 3',
      gridColumn: '2 / 3',
    },
    checkbox: {
      flex: 0,
      gridRow: '1 / 2',
      gridColumn: '1 / 2',
      _groupFocusVisible: {
        opacity: 0.85,
      },
    },
  },
  variants: {},
  defaultVariants: {},
})

export type BranchVariants = RecipeVariantProps<typeof branch>
export type ItemVariants = RecipeVariantProps<typeof item>

const { withProvider, withContext } = createStyleContext(branch)
const { withProvider: withItemProvider, withContext: withItemContext } = createStyleContext(item)

const Root = withProvider('div', 'root') as FC<BranchVariants & HTMLAttributes<HTMLDivElement>>
const Control = withContext('button', 'control', {
  defaultProps: {
    className: 'group',
  },
}) as FC<HTMLAttributes<HTMLButtonElement>>

const Checkbox = withContext(MantineCheckbox, 'checkbox', {
  defaultProps: {
    size: 'sm',
  },
}) as typeof MantineCheckbox
const Label = withContext('div', 'label', {}) as FC<HTMLAttributes<HTMLLabelElement>>
const Description = withContext('div', 'description', {}) as FC<HTMLAttributes<HTMLDivElement>>
const IndentGuide = withContext('div', 'indentGuide') as FC<HTMLAttributes<HTMLDivElement>>
const Content = withContext('div', 'content') as FC<HTMLAttributes<HTMLDivElement>>
const ContentHeader = withContext('div', 'contentHeader') as FC<HTMLAttributes<HTMLDivElement>>
const Indicator = withContext(IconChevronRight, 'indicator', {
  defaultProps: {
    size: 16,
  },
}) as FC<HTMLAttributes<HTMLDivElement>>

const Badge = withContext('div', 'badge') as FC<HTMLAttributes<HTMLDivElement>>

export const TreeBranch = {
  Root,
  Control,
  Checkbox,
  Label,
  Description,
  IndentGuide,
  Content,
  ContentHeader,
  Indicator,
  Badge,
}

const ItemRoot = withItemProvider('div', 'root', {
  defaultProps: {
    className: 'group',
  },
}) as FC<ItemVariants & HTMLAttributes<HTMLDivElement>>
const ItemCheckbox = withItemContext(MantineCheckbox, 'checkbox', {
  defaultProps: {
    size: 'sm',
  },
}) as typeof MantineCheckbox
const ItemLabel = withItemContext('div', 'label') as FC<HTMLAttributes<HTMLDivElement>>
const ItemDescription = withItemContext('div', 'description') as FC<HTMLAttributes<HTMLDivElement>>

export const TreeItem = {
  Root: ItemRoot,
  Checkbox: ItemCheckbox,
  Label: ItemLabel,
  Description: ItemDescription,
}
