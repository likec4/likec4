import { css, cva } from '@likec4/styles/css'
import { HStack, styled } from '@likec4/styles/jsx'
import { hstack } from '@likec4/styles/patterns'
import { m } from 'motion/react'
import type { ReactNode } from 'react'
import { recessed } from './depth-of-field'
import { flowPresentation } from './presentation'
import type { OutlineTreeNodeFlow } from './types'

/** Small pill tag for the sub-flow operator (`loop`, `par`, `try`, …). */
const flowTagBase = cva({
  base: {
    flex: 'none',
    paddingInline: '1.5',
    paddingBlock: '0.5',
    rounded: 'sm',
    bg: 'colorPalette.label',
    color: 'colorPalette.text',
    fontSize: '[9px]',
    fontWeight: 'bold',
    lineHeight: 'xs',
    letterSpacing: 'tight',
    textTransform: 'uppercase',
    userSelect: 'none',
  },
  variants: {
    dimmed: {
      true: {
        opacity: '0.7',
      },
    },
  },
})

export const FlowTag = styled('div', flowTagBase)

/** The header line of a sub-flow: its icon, title and operator tag. */
export const FlowRow = ({ node, recession, isCollapsed }: {
  node: OutlineTreeNodeFlow
  recession: number
  isCollapsed?: boolean
}) => {
  const { tag, Icon } = flowPresentation[node.nodeProps.type]
  return (
    <m.div
      layout
      className={hstack(
        css.raw(
          recessed,
          {
            alignItems: 'center',
            gap: '1.5',
            marginTop: '2',
            marginBottom: '0.5',
            paddingInline: '1.5',
            paddingBlock: '0.5',
            color: 'text',
            userSelect: 'none',
          },
          isCollapsed ? { bg: 'colorPalette.label' } : undefined,
        ),
      )}
      style={{ ['--seq-r' as string]: recession }}
    >
      <Icon size={13} className={css({ flex: 'none', color: 'colorPalette.text' })} />
      <styled.span
        css={{
          flex: '1',
          minWidth: '0',
          fontSize: 'xs',
          fontWeight: 'medium',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
        {node.nodeProps.title ?? tag}
      </styled.span>
      <FlowTag>{tag}</FlowTag>
    </m.div>
  )
}
