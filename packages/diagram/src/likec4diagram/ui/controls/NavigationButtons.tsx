import { IconChevronRight } from '@tabler/icons-react'

import { AnimatePresence, m } from 'framer-motion'

import { IconChevronLeft } from '@tabler/icons-react'
import { useDiagram, useDiagramContext } from '../../../hooks/useDiagram'
import { ActionIcon } from './_shared'

export const NavigationButtons = () => {
  const diagram = useDiagram()
  const {
    hasStepBack,
    hasStepForward,
  } = useDiagramContext(s => ({
    hasStepBack: s.navigationHistory.currentIndex > 0,
    hasStepForward: s.navigationHistory.currentIndex < s.navigationHistory.history.length - 1,
  }))
  return (
    <AnimatePresence>
      {hasStepBack && (
        <m.div
          layout
          initial={{ opacity: 0.05, transform: 'translateX(-10px)' }}
          animate={{ opacity: 1, transform: 'translateX(0)' }}
          exit={{
            opacity: 0.05,
            transform: 'translateX(-10px)',
          }}
          key={'back'}>
          <ActionIcon
            onClick={e => {
              e.stopPropagation()
              diagram.navigate('back')
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
            transform: 'translateX(10px)',
          }}
          key={'forward'}>
          <ActionIcon
            onClick={e => {
              e.stopPropagation()
              diagram.navigate('forward')
            }}>
            <IconChevronRight />
          </ActionIcon>
        </m.div>
      )}
    </AnimatePresence>
  )
}
