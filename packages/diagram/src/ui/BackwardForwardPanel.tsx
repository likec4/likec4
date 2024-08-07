import { ActionIcon, Group } from '@mantine/core'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import clsx from 'clsx'
import { AnimatePresence, m } from 'framer-motion'
import { type DiagramState, useDiagramState } from '../state/hooks'
import * as css from './BackwardForwardPanel.css'

const historySelector = (s: DiagramState) => ({
  hasStepBack: s.navigationHistoryIndex > 0,
  hasStepForward: s.navigationHistoryIndex < s.navigationHistory.length - 1,
  goBack: s.goBack,
  goForward: s.goForward
})

export function BackwardForwardPanel() {
  const {
    hasStepBack,
    hasStepForward,
    goBack,
    goForward
  } = useDiagramState(historySelector)
  return (
    <Group
      className={clsx(
        'react-flow__panel',
        css.panel,
        'likec4-navigation-panel'
      )}
      gap={'xs'}>
      <AnimatePresence>
        {hasStepBack && (
          <m.div
            layout
            initial={{ opacity: 0.05, transform: 'translateX(-10px)' }}
            animate={{ opacity: 1, transform: 'translateX(0)' }}
            exit={{
              opacity: 0.05,
              transform: 'translateX(-10px)'
            }}
            key={'back'}>
            <ActionIcon
              variant="light"
              color="gray"
              onClick={e => {
                e.stopPropagation()
                goBack()
              }}>
              <IconChevronLeft />
            </ActionIcon>
          </m.div>
        )}
        {hasStepForward && (
          <m.div
            layout
            initial={{ opacity: 0.05, transform: 'translateX(10px)' }}
            animate={{ opacity: 1, transform: 'translateX(0)' }}
            exit={{
              opacity: 0,
              transform: 'translateX(10px)'
            }}
            key={'forward'}>
            <ActionIcon
              variant="light"
              color="gray"
              onClick={e => {
                e.stopPropagation()
                goForward()
              }}>
              <IconChevronRight />
            </ActionIcon>
          </m.div>
        )}
      </AnimatePresence>
    </Group>
  )
}
