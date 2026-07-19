import { nonexhaustive } from '@likec4/core'
import { css, sva } from '@likec4/styles/css'
import { createStyleContext, isCssProperty } from '@likec4/styles/jsx'
import { hstack } from '@likec4/styles/patterns'
import { type ForwardRefComponent, type HTMLMotionProps, isValidMotionProp } from 'motion/react'
import * as m from 'motion/react-m'
import type { ReactNode } from 'react'
import { useDiagram } from '../../../hooks'
import { stopPropagation } from '../../../utils'
import type { Types } from '../../types'

const typeLabelStyle = css.raw({
  color: 'colorPalette.text',
  fontSize: '[9px]',
  fontWeight: 'bold',
  lineHeight: 'xs',
  letterSpacing: 'tight',
  textTransform: 'uppercase',
})

const withBorder = css.raw({
  border: '{borderWidths.2} solid {colors.colorPalette.border}',
})

const withBackground = css.raw({
  background: 'colorPalette',
  ['&[data-state="hovered"]']: {
    background: 'colorPalette.hovered',
    transition: 'faster',
    transitionDelay: 'faster',
    transitionTimingFunction: 'out',
    transitionProperty: 'background',
  },
  ['&[data-state="collapsed"]']: {
    background: 'colorPalette.label',
  },
})

const recipe = sva({
  slots: ['root', 'content', 'header', 'flowtype', 'branchtype', 'title'],
  base: {
    root: css.raw({
      width: '100%',
      height: '100%',
      padding: '0',
    }),
    content: hstack.raw({
      gap: '2',
      width: '100%',
      alignItems: 'baseline',
    }),
    header: css.raw(typeLabelStyle, withBorder, hstack.raw(), {
      width: '100%',
      borderTopLeftRadius: 'md',
      borderTopRightRadius: 'md',
      paddingInline: '2',
      borderBottomWidth: '1',
      background: 'colorPalette.header',
    }),
    'flowtype': css.raw(typeLabelStyle, withBorder, { // position: 'absolute',
      // alignSelf: 'stretch',
      paddingInline: '2',
      paddingBlock: '1',
      background: 'colorPalette.label',
      // clipPath: 'polygon(0px 0px, 100% 0px, calc(100% - 8px) 100%, 0px 100%)',
      width: 'max-content',
      borderTopLeftRadius: 'sm',
      borderBottomRightRadius: 'sm',
      borderTop: 'none',
      borderLeft: 'none',
      [':is([data-state="collapsed"]) &']: {
        // alignSelf: 'stretch',
        background: 'none',
        borderColor: 'transparent',
      },
    }),
    'branchtype': css.raw(typeLabelStyle, {
      position: 'relative',
      background: 'colorPalette.label',
      paddingLeft: '4.5',
      paddingRight: '2',
      paddingBlock: '1',
      marginBlock: '2',
      marginInlineStart: '2',
      rounded: 'sm',
      minWidth: '[40px]',
      width: 'min-content',
      textAlign: 'center',
      _before: {
        position: 'absolute',
        content: '" "',
        background: 'currentColor',
        width: '[5px]',
        height: '[5px]',
        opacity: '[.6]',
        rounded: 'pill',
        top: '[50%]',
        left: '2',
        transform: 'translateY(-50%)',
      },
    }),
    title: {
      flex: '1',
      color: `[oklch(from {colors.colorPalette.text} l calc(c - 0.15) h)]`,
      fontSize: 'xxs',
      fontWeight: 'normal',
    },
  },
  variants: {
    variant: {
      subflow: {
        root: css.raw(withBackground, withBorder, {
          rounded: 'md',
        }),
        content: {
          minHeight: '[22px]',
        },
        flowtype: {
          alignSelf: 'stretch',
          alignContent: 'center',
        },
        title: {
          paddingTop: '0.5',
        },
      },
      branch: {
        root: css.raw(withBackground, withBorder, {
          rounded: '0',
          borderTopWidth: '1',
          ['&[data-is-last="true"]']: {
            borderBottomLeftRadius: 'md',
            borderBottomRightRadius: 'md',
          },
          ['&:not([data-is-last="true"])']: {
            borderBottomWidth: '1',
          },
          ['&[data-state="collapsed"]']: {
            background: 'colorPalette.header',
          },
        }),
      },
      withbranches: {
        root: {
          background: 'none',
        },
        content: {
          display: 'contents',
        },
      },
    },
  },
  defaultVariants: {
    variant: 'subflow',
  },
  className: 'seq-subflow',
})

const { withContext, withProvider } = createStyleContext(recipe)

const shouldForwardProp = (prop: string, variantKeys: string[]): boolean =>
  !variantKeys.includes(prop) && (isValidMotionProp(prop) || !isCssProperty(prop))

const SubflowRoot = withProvider(m.div as ForwardRefComponent<'div', HTMLMotionProps<'div'>>, 'root', {
  shouldForwardProp,
})
const Content = withContext('div', 'content')
const Header = withContext('div', 'header')
const FlowType = withContext('div', 'flowtype')
const BranchType = withContext('div', 'branchtype')
const Title = withContext('div', 'title')

export function SequenceSubflowArea(props: Types.NodeProps<'seq-subflow'>) {
  const { data } = props
  const isDimmed = data.dimmed ?? false
  const diagram = useDiagram()

  const toggleSequenceFlow = (event: React.MouseEvent) => {
    event.stopPropagation()
    diagram.toggleSequenceFlow(data.flowId)
  }

  let colorClassname
  let variant: 'subflow' | 'withbranches' | 'branch'
  let body: ReactNode
  switch (data.flowType) {
    case 'par':
    case 'loop':
    case 'opt': {
      variant = 'subflow'
      // PandaCSS Static analyzer fails here
      colorClassname = data.flowType == 'par'
        ? css({ colorPalette: 'subflow.par' })
        : data.flowType == 'loop'
        ? css({ colorPalette: 'subflow.loop' })
        : css({ colorPalette: 'subflow.opt' })
      body = <FlowType onClick={toggleSequenceFlow}>{data.flowType}</FlowType>
      break
    }
    case 'break': {
      variant = 'subflow'
      colorClassname = css({ colorPalette: `subflow.break` })
      body = <FlowType onClick={toggleSequenceFlow}>{data.flowType}</FlowType>
      break
    }
    case 'alt': {
      variant = 'withbranches'
      colorClassname = css({ colorPalette: 'subflow.alt' })
      body = <Header onClick={toggleSequenceFlow} style={{ height: data.headerHeight }}>ALTERNATIVE</Header>
      break
    }
    case 'alt-when':
    case 'alt-else':
    case 'alt-if': {
      variant = 'branch'
      colorClassname = css({ colorPalette: 'subflow.alt' })
      body = <BranchType onClick={toggleSequenceFlow}>{data.flowType.substring(4)}</BranchType>
      break
    }
    case 'try': {
      variant = 'withbranches'
      colorClassname = css({ colorPalette: 'subflow.try' })
      body = <Header onClick={toggleSequenceFlow} style={{ height: data.headerHeight }}>CRITICAL</Header>
      break
    }
    case 'try-block': {
      variant = 'branch'
      colorClassname = css({ colorPalette: `subflow.try` })
      body = <BranchType onClick={toggleSequenceFlow}>TRY</BranchType>
      break
    }
    case 'try-catch':
    case 'try-finally': {
      variant = 'branch'
      colorClassname = css({ colorPalette: `subflow.break` })
      body = <BranchType onClick={toggleSequenceFlow}>{data.flowType.substring(4)}</BranchType>
      break
    }
    default:
      nonexhaustive(data)
      //
  }

  let state = ''
  if (data.collapsed === true) {
    state = 'collapsed'
  } else if (data.hovered) {
    state = 'hovered'
  }

  return (
    <SubflowRoot
      variant={variant}
      className={colorClassname}
      data-is-first={data.isFirst === true}
      data-is-last={data.isLast === true}
      data-state={state}
      {...(isDimmed !== false && {
        'data-likec4-dimmed': isDimmed,
      })}
    >
      <Content>
        {body}
        {data.title && <Title onClick={toggleSequenceFlow}>{data.title}</Title>}
      </Content>
    </SubflowRoot>
  )
}
