import { RichText } from '@likec4/core'
import { css } from '@likec4/styles/css'
import { styled } from '@likec4/styles/jsx'
import { vstack } from '@likec4/styles/patterns'
import {
  ScrollAreaAutosize,
} from '@mantine/core'
import { AnimatePresence, m } from 'motion/react'
import { memo } from 'react'
import { isNonNull, isTruthy } from 'remeda'
import { Markdown } from '../../base-primitives'
import type { DiagramContext } from '../../hooks/useDiagram'
import { useDiagramContext } from '../../hooks/useDiagram'

const SectionHeader = styled('div', {
  base: {
    fontSize: 'xs',
    color: 'mantine.colors.dimmed',
    fontWeight: 'medium',
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
    notes: isActive ? s.xyedges[activeStepIndex]?.data?.notes ?? null : null,
  }
}

export const WalkthroughPanel = memo(() => {
  const { isActive, notes: _notes } = useDiagramContext(selectWalkthroughNotes)

  const notes = _notes ? RichText.from(_notes) : RichText.EMPTY

  return (
    <AnimatePresence>
      {isActive && !notes.isEmpty && (
        <m.div
          layout="position"
          className={css({
            position: 'relative',
          })}
          initial={{
            opacity: 0,
            translateX: -20,
          }}
          animate={{
            opacity: 1,
            translateX: 0,
          }}
          exit={{
            opacity: 0,
            translateX: -20,
          }}
        >
          <ScrollAreaAutosize
            className={vstack({
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
            })}
            type="scroll"
          >
            <SectionHeader>Notes</SectionHeader>
            <Markdown
              value={notes}
              fontSize="sm"
              emptyText="No description"
              className={css({
                userSelect: 'all',
              })}
            />
          </ScrollAreaAutosize>
        </m.div>
      )}
    </AnimatePresence>
  )
})
