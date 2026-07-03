import { nonexhaustive } from '@likec4/core'
import type { StepPath } from '@likec4/core/types'
import { css, sva } from '@likec4/styles/css'
import { createStyleContext, isCssProperty, styled } from '@likec4/styles/jsx'
import { hstack } from '@likec4/styles/patterns'
import { type ForwardRefComponent, type HTMLMotionProps, isValidMotionProp } from 'motion/react'
import * as m from 'motion/react-m'
import type { JSX } from 'react'
import { first, isNullish, isString, isTruthy } from 'remeda'
import type { Types } from '../../types'

const typeLabelStyle = css.raw({
  color: 'colorPalette.text',
  fontSize: '[9px]',
  fontWeight: 'extrabold',
  lineHeight: 'xs',
  letterSpacing: 'tight',
  textTransform: 'uppercase',
})

const withBorder = css.raw({
  border: '{borderWidths.2} solid {colors.colorPalette.border}',
})

const recipe = sva({
  slots: ['root', 'flow-type', 'header', 'title', 'swimline', 'swimline-type'],
  base: {
    root: {
      width: '100%',
      height: '100%',
      padding: '0',
      position: 'relative',
      boxSizing: 'content-box',
      _whenDimmed: {
        opacity: '0.5',
      },
    },
    'flow-type': css.raw(typeLabelStyle, withBorder, {
      position: 'absolute',
      top: '0',
      left: '0',
      paddingInline: '2',
      paddingBlock: '1',
      background: 'colorPalette.label',
      // clipPath: 'polygon(0px 0px, 100% 0px, calc(100% - 8px) 100%, 0px 100%)',
      width: 'max-content',
      borderTopLeftRadius: 'sm',
      borderBottomRightRadius: 'md',
      borderTop: 'none',
      borderLeft: 'none',
    }),
    swimline: css.raw(withBorder, {
      position: 'absolute',
      width: 'full',
      backgroundColor: 'colorPalette',
      _firstOfType: {
        borderTopLeftRadius: 'md',
        borderTopRightRadius: 'md',
      },
      _lastOfType: {
        borderBottomLeftRadius: 'md',
        borderBottomRightRadius: 'md',
      },

      ['&[data-active-flow="false"]']: {
        opacity: '0.25',
      },
      ['&[data-active-flow="true"]']: {
        opacity: '1',
        ['& + &']: {
          borderTop: 'none',
        },
      },
      ['&:not(:first-of-type):not([data-active-flow="true"])']: {
        borderTop: 'none',
      },
    }),
    header: css.raw(typeLabelStyle, hstack.raw(), {
      paddingInline: '2',
      background: 'colorPalette.header!',
    }),
    'swimline-type': css.raw(typeLabelStyle, {
      position: 'relative',
      background: 'colorPalette.label!',
      paddingLeft: '5',
      paddingRight: '2',
      paddingBlock: '1',
      rounded: 'sm',
      minWidth: '[40px]',
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
    'title': {
      color: [
        'colorPalette.text',
      ],
      textStyle: 'sm',
      fontWeight: 'medium',
    },
  },
  variants: {
    filled: {
      true: {
        root: css.raw(withBorder, {
          background: 'colorPalette',
          rounded: 'md',
        }),
      },
      false: {},
    },
    subflow: {
      opt: {
        root: {
          colorPalette: 'subflow.opt',
        },
      },
      alt: {
        root: {
          colorPalette: 'subflow.alt',
          position: 'relative',
        },
      },
      par: {
        root: {
          colorPalette: 'subflow.par',
        },
      },
      loop: {
        root: {
          colorPalette: 'subflow.loop',
        },
      },
      break: {
        root: {
          colorPalette: 'subflow.try.catch',
        },
      },
      try: {
        root: {
          colorPalette: 'subflow.try.block',
          position: 'relative',
        },
      },
    },
  },
  defaultVariants: {
    filled: false,
  },
  className: 'seq-subflow',
})

const { withContext, withProvider } = createStyleContext(recipe)

const shouldForwardProp = (prop: string, variantKeys: string[]): boolean =>
  !variantKeys.includes(prop) && (isValidMotionProp(prop) || !isCssProperty(prop))

const SubflowRoot = withProvider(m.div as ForwardRefComponent<'div', HTMLMotionProps<'div'>>, 'root', {
  shouldForwardProp,
})
const SubflowTypeLabel = withContext('div', 'flow-type')
const Swimline = withContext('div', 'swimline')
const Title = withContext('div', 'title')
const Content = styled('div', {
  base: hstack.raw({
    padding: '2',
    gap: '4',
  }),
})
const Header = withContext(Swimline, 'header')
const SubflowHeader = withContext('div', 'swimline-type')

const Container = styled('div', {
  base: {
    display: 'contents',
  },
})

export function SequenceSubflowArea(props: Types.NodeProps<'seq-subflow'>) {
  const { data } = props
  const isDimmed = data.dimmed ?? false

  let subflow: JSX.Element
  switch (data.flowType) {
    case 'alt':
      subflow = <AltSubflow data={data} />
      break
    case 'try':
      subflow = <TrySubflow data={data} />
      break
    case 'par':
    case 'break':
    case 'loop':
    case 'opt':
      subflow = <GenericSubflow data={data} />
      break
    default:
      nonexhaustive(data)
  }

  return (
    <Container
      data-likec4-hovered={data.hovered === true}
      {...(isDimmed !== false && {
        'data-likec4-dimmed': isDimmed,
      })}
    >
      {subflow}
    </Container>
  )
}

type SubflowNodeProps<T extends Types.SequenceSubflowData['flowType']> = {
  data: Extract<Types.SequenceSubflowData, { flowType: T }>
}
const truncateType = <T extends string>(s: `alt-${T}`): T => s.substring('alt-'.length) as any as T

function subflowActiveState(
  activeBranch: StepPath | undefined,
): (subflow?: { flowId: StepPath }) => Record<`data-${string}`, unknown>
function subflowActiveState(
  subflow: { activeBranch?: StepPath | undefined; flowId: StepPath },
): Record<`data-${string}`, unknown>
function subflowActiveState(arg: StepPath | undefined | { activeBranch?: StepPath | undefined; flowId: StepPath }) {
  if (isNullish(arg)) {
    return () => ({})
  }
  if (isString(arg)) {
    return (subflow?: { flowId: StepPath }) => (subflow ?
      {
        ['data-active-flow']: arg.startsWith(subflow.flowId),
      } :
      {})
  }
  return isTruthy(arg.activeBranch) ?
    {
      ['data-active-flow']: arg.activeBranch.startsWith(arg.flowId),
    } :
    {}
}

function AltSubflow({
  data: {
    activeBranch,
    dimmed,
    title,
    branches,
  },
}: SubflowNodeProps<'alt'>) {
  const firstBranchOffset = first(branches)?.y ?? 10
  const branchState = subflowActiveState(activeBranch)
  return (
    <SubflowRoot subflow={'alt'}>
      <Header
        {...branchState(first(branches))}
        style={{
          height: firstBranchOffset,
        }}>
        ALT
      </Header>
      {branches.map(b => (
        <Swimline
          key={b.flowId}
          {...branchState(b)}
          style={{
            top: b.y,
            height: b.height,
          }}>
          <Content>
            <SubflowHeader>
              {truncateType(b.flowType)}
            </SubflowHeader>
            {b.title && <Title>{b.title}</Title>}
          </Content>
        </Swimline>
      ))}
    </SubflowRoot>
  )
}

function TrySubflow({
  data: {
    activeBranch,
    tryBlock,
    catchBlock,
    finallyBlock,
  },
}: SubflowNodeProps<'try'>) {
  const branchState = subflowActiveState(activeBranch)

  const tryBlockState = branchState(tryBlock)
  return (
    <SubflowRoot subflow={'try'}>
      <Header {...tryBlockState} style={{ height: tryBlock.y }}>CRITICAL</Header>
      <Swimline
        {...tryBlockState}
        css={{
          colorPalette: 'subflow.try.block',
        }}
        style={{
          top: tryBlock.y,
          height: tryBlock.height,
        }}>
        <Content>
          <SubflowHeader>TRY</SubflowHeader>
          {tryBlock.title && <Title>{tryBlock.title}</Title>}
        </Content>
        {/* <SubflowLabel>TRY</SubflowLabel> */}
      </Swimline>
      {catchBlock && (
        <Swimline
          {...branchState(catchBlock)}
          css={{
            colorPalette: 'subflow.try.catch',
          }}
          style={{
            top: catchBlock.y,
            height: catchBlock.height,
          }}>
          <Content>
            <SubflowHeader>CATCH</SubflowHeader>
            {catchBlock.title && <Title>{catchBlock.title}</Title>}
          </Content>
        </Swimline>
      )}
      {finallyBlock && (
        <Swimline
          {...branchState(finallyBlock)}
          css={{
            colorPalette: 'subflow.try.catch',
          }}
          style={{
            top: finallyBlock.y,
            height: finallyBlock.height,
          }}>
          <Content>
            <SubflowHeader>FINALLY</SubflowHeader>
            {finallyBlock.title && <Title>{finallyBlock.title}</Title>}
          </Content>
        </Swimline>
      )}
    </SubflowRoot>
  )
}

function GenericSubflow({
  data,
}: SubflowNodeProps<'par' | 'opt' | 'loop' | 'break'>) {
  return (
    <SubflowRoot
      subflow={data.flowType}
      {...subflowActiveState(data)}
      filled>
      <SubflowTypeLabel>{data.flowType}</SubflowTypeLabel>
      {data.title && (
        <Content paddingTop={'1'} paddingLeft={'16'}>
          <Title>{data.title}</Title>
        </Content>
      )}
    </SubflowRoot>
  )
}
