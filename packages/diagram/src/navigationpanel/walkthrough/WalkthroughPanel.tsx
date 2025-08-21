import { RichText } from '@likec4/core'
import { css, cx } from '@likec4/styles/css'
import { styled } from '@likec4/styles/jsx'
import { vstack } from '@likec4/styles/patterns'
import {
  ScrollAreaAutosize,
} from '@mantine/core'
import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { isNonNull, isTruthy } from 'remeda'
import { MarkdownBlock } from '../../custom'
import { useDiagramContext } from '../../hooks/useDiagram'
import { stopPropagation } from '../../utils'

const SectionHeader = styled('div', {
  base: {
    fontSize: 'xs',
    color: 'mantine.colors.dimmed',
    fontWeight: 500,
    userSelect: 'none',
    mb: 'xxs',
  },
})

export const WalkthroughPanel = () => {
  const {
    notes,
  } = useDiagramContext(s => {
    const activeStepIndex = s.xyedges.findIndex(e => e.id === s.activeWalkthrough?.stepId)
    return {
      isActive: isNonNull(s.activeWalkthrough),
      isParallel: isTruthy(s.activeWalkthrough?.parallelPrefix),
      hasNext: activeStepIndex < s.xyedges.length - 1,
      hasPrevious: activeStepIndex > 0,
      notes: s.xyedges[activeStepIndex]?.data?.notes ?? RichText.EMPTY,
    }
  })
  if (!notes || notes.isEmpty) {
    return null
  }

  return (
    <AnimatePresence>
      <m.div
        onPointerDownCapture={stopPropagation}
        onClick={stopPropagation}
        onDoubleClick={stopPropagation}
      >
        <ScrollAreaAutosize
          className={cx(
            'nowheel nopan nodrag',
            vstack({
              margin: 'xs',
              layerStyle: 'likec4.dropdown',
              position: 'absolute',
              gap: 'md',
              padding: 'md',
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
          miw={180}
          maw={450}
          mah={350}
          type="scroll"
          mx={'auto'}
          mt={2}
        >
          <section>
            <SectionHeader>Notes</SectionHeader>
            <MarkdownBlock
              value={notes}
              fontSize="sm"
              emptyText="No description"
              className={css({
                userSelect: 'all',
              })}
            />
          </section>
        </ScrollAreaAutosize>
      </m.div>
    </AnimatePresence>
  )
}
