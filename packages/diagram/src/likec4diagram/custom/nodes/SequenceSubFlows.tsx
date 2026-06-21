import { type DynamicViewFlow, flowGuards } from '@likec4/core'
import { sva } from '@likec4/styles/css'
import { Box, createStyleContext, HStack, styled } from '@likec4/styles/jsx'
import { hstack, vstack } from '@likec4/styles/patterns'
import { IconExclamationCircle } from '@tabler/icons-react'
import { first } from 'remeda'
import type { Types } from '../../types'

const recipe = sva({
  slots: ['root', 'label', 'title', 'swimline', 'swimline-badge', 'swimline-header'],
  base: {
    root: {
      width: '100%',
      height: '100%',
      border: 'default',
      rounded: 'md',
      padding: '0',
      borderWidth: '2',
      boxSizing: 'content-box',
      borderColor: 'colorPalette.border',
    },
    label: {
      color: 'colorPalette.text',
      fontSize: '[9px]',
      fontWeight: 'bold',
      letterSpacing: '.5px',
      paddingInline: '2',
      paddingBlock: '1',
      textTransform: 'uppercase',
      background: 'colorPalette.badge',
      // clipPath: 'polygon(0px 0px, 100% 0px, calc(100% - 8px) 100%, 0px 100%)',
      width: 'max-content',
      borderTopLeftRadius: 'sm',
      borderBottomRightRadius: 'md',
      borderRight: '{borderWidths.2} solid {colors.colorPalette.border}',
      borderBottom: '{borderWidths.2} solid {colors.colorPalette.border}',
    },
    swimline: {
      position: 'absolute',
      width: 'full',
      backgroundColor: 'colorPalette',
      border: 'default',
      borderWidth: '2',
      borderColor: 'colorPalette.border',
      _firstOfType: {
        borderTopLeftRadius: 'md',
        borderTopRightRadius: 'md',
      },
      ['&:not(:first-of-type)']: {
        borderTop: 'none',
      },
      _lastOfType: {
        borderBottomLeftRadius: 'md',
        borderBottomRightRadius: 'md',
      },
    },
    'swimline-header': hstack.raw({
      color: 'colorPalette.text',
      background: 'colorPalette.header!',
    }),
    'swimline-badge': {
      position: 'relative',
      background: 'colorPalette.badge!',
      fontSize: '[9px]',
      fontWeight: 'bold',
      letterSpacing: '.5px',
      paddingLeft: '5',
      paddingRight: '2',
      paddingBlock: '1',
      rounded: 'sm',
      textTransform: 'uppercase',
      color: 'colorPalette.text',
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
    },
    'title': {
      color: [
        'colorPalette.text',
      ],
      textStyle: 'sm',
      fontWeight: 'medium',
    },
  },
  variants: {
    subflow: {
      opt: {
        root: {
          colorPalette: 'sequence.opt',
        },
      },
      alt: {
        root: {
          colorPalette: 'sequence.alt',
          backgroundColor: 'transparent',
          border: 'none',
          rounded: '0',
        },
      },
      par: {
        root: {
          colorPalette: 'sequence.par',
        },
      },
      loop: {
        root: {
          colorPalette: 'sequence.loop',
        },
      },
      try: {
        root: {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          rounded: '0',
          border: 'none',
        },
      },
    },
  },
  className: 'seq-subflow',
})

const { withContext, withProvider } = createStyleContext(recipe)

const SubflowRoot = withProvider('div', 'root')
const SubflowLabel = withContext('div', 'label')
const Swimline = withContext('div', 'swimline')
const Title = withContext('div', 'title')
const SwimlineContent = styled('div', {
  base: hstack.raw({
    padding: '2',
    gap: '4',
  }),
})
const SwimlineHeader = withContext(Swimline, 'swimline-header')
const SwimlineBadge = withContext('div', 'swimline-badge')

export function SequenceSubflowArea({ data }: Types.NodeProps<'seq-subflow'>) {
  if (data.flowType === 'alt') {
    return <AltSubflow data={data} />
  }
  if (data.flowType === 'try') {
    return <TrySubflow data={data} />
  }

  return (
    <SubflowRoot subflow={data.flowType}>
      {
        /* <SwimlineContent>
        <SwimlineBadge>
          {data.flowType}
        </SwimlineBadge>
        {data.title && <Title>{data.title}</Title>}
      </SwimlineContent> */
      }
      <SubflowLabel>{data.flowType}</SubflowLabel>
    </SubflowRoot>
  )
}

function AltSubflow({
  data: {
    flowType,
    title,
    branches,
  },
}: { data: Extract<Types.SequenceSubflowAreaData, { flowType: 'alt' }> }) {
  const firstBranchOffset = first(branches)?.y ?? 10
  return (
    <SubflowRoot subflow={'alt'}>
      <SwimlineHeader
        style={{
          height: firstBranchOffset,
        }}>
      </SwimlineHeader>
      {branches.map(b => (
        <Swimline
          key={b.id}
          style={{
            top: b.y,
            height: b.height,
          }}>
          <SwimlineContent>
            <SwimlineBadge>
              {b._type}
            </SwimlineBadge>
            {b.title && <Title>{b.title}</Title>}
          </SwimlineContent>
        </Swimline>
      ))}
    </SubflowRoot>
  )
}

function TrySubflow({
  data: {
    y,
    tryBlock,
    catchBlock,
    finallyBlock,
  },
}: { data: Extract<Types.SequenceSubflowAreaData, { flowType: 'try' }> }) {
  return (
    <SubflowRoot subflow={'try'} position="relative">
      <SwimlineHeader
        css={{
          colorPalette: 'sequence.try.block',
        }}
        style={{ height: tryBlock.y }}>
        {/* <IconExclamationCircle stroke={2} size={14} /> */}
        {/* <SubflowLabel>TRY</SubflowLabel> */}
      </SwimlineHeader>
      <Swimline
        css={{
          colorPalette: 'sequence.try.block',
        }}
        style={{
          top: tryBlock.y,
          height: tryBlock.height,
        }}>
        <SwimlineContent>
          <SwimlineBadge>TRY</SwimlineBadge>
          {tryBlock.title && <Title>{tryBlock.title}</Title>}
        </SwimlineContent>
        {/* <SubflowLabel>TRY</SubflowLabel> */}
      </Swimline>
      {catchBlock && (
        <Swimline
          css={{
            colorPalette: 'sequence.try.catch',
          }}
          style={{
            top: catchBlock.y,
            height: catchBlock.height,
          }}>
          <SwimlineContent>
            <SwimlineBadge>CATCH</SwimlineBadge>
            {catchBlock.title && <Title>{catchBlock.title}</Title>}
          </SwimlineContent>
        </Swimline>
      )}
      {finallyBlock && (
        <Swimline
          css={{
            colorPalette: 'sequence.try.catch',
          }}
          style={{
            top: finallyBlock.y,
            height: finallyBlock.height,
          }}>
          <SwimlineContent>
            <SwimlineBadge>FINALLY</SwimlineBadge>
            {finallyBlock.title && <Title>{finallyBlock.title}</Title>}
          </SwimlineContent>
        </Swimline>
      )}
    </SubflowRoot>
  )
}
