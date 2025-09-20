import { RichText } from '@likec4/core'
import { css, cx } from '@likec4/styles/css'
import { styled } from '@likec4/styles/jsx'
import { vstack } from '@likec4/styles/patterns'
import {
  ScrollAreaAutosize,
} from '@mantine/core'
import { isNonNull, isTruthy } from 'remeda'
import { MarkdownBlock } from '../../base/primitives'
import { useDiagramContext } from '../../hooks/useDiagram'
import type { DiagramContext } from '../../state/types'

const SectionHeader = styled('div', {
  base: {
    fontSize: 'xs',
    color: 'mantine.colors.dimmed',
    fontWeight: 500,
    userSelect: 'none',
    mb: 'xxs',
  },
})

function selectWalkthroughNotes(s: DiagramContext) {
  const isActive = isNonNull(s.activeWalkthrough)
  const activeStepIndex = isActive ? s.xyedges.findIndex(e => e.id === s.activeWalkthrough?.stepId) : -1
  return {
    isActive,
    isParallel: isActive && isTruthy(s.activeWalkthrough?.parallelPrefix),
    hasNext: isActive && activeStepIndex < s.xyedges.length - 1,
    hasPrevious: isActive && activeStepIndex > 0,
    notes: isActive ? s.xyedges[activeStepIndex]?.data?.notes ?? RichText.EMPTY : null,
  }
}

export const WalkthroughPanel = () => {
  const { notes } = useDiagramContext(selectWalkthroughNotes)

  if (!notes || notes.isEmpty) {
    return null
  }

  return (
    <styled.div position={'relative'}>
      <ScrollAreaAutosize
        className={cx(
          'nowheel nopan nodrag',
          vstack({
            position: 'absolute',
            layerStyle: 'likec4.dropdown',
            gap: 'sm',
            padding: 'md',
            paddingTop: 'xxs',
            pointerEvents: 'all',
            maxWidth: 'calc(100cqw - 32px)',
            minWidth: 'calc(100cqw - 50px)',
            maxHeight: 'calc(100cqh - 100px)',
            width: 'max-content',
            cursor: 'default',
            overflow: 'auto',
            overscrollBehavior: 'contain',
            '@/sm': {
              minWidth: 400,
              maxWidth: 550,
            },
            '@/lg': {
              maxWidth: 700,
            },
          }),
        )}
        // miw={180}
        // maw={450}
        // mah={350}
        type="scroll"
        // mt={2}
      >
        <SectionHeader>Notes</SectionHeader>
        <MarkdownBlock
          value={notes}
          fontSize="sm"
          emptyText="No description"
          className={css({
            userSelect: 'all',
          })}
        />
      </ScrollAreaAutosize>
    </styled.div>
  )
}
