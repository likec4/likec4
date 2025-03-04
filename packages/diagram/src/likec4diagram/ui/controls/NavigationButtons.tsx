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
        <ActionIcon
          component={m.button}
          onClick={e => {
            e.stopPropagation()
            diagram.navigate('back')
          }}
          layout
          initial={{ opacity: 0.05, transform: 'translateX(-10px)' }}
          animate={{ opacity: 1, transform: 'translateX(0)' }}
          exit={{
            opacity: 0.05,
            transform: 'translateX(-10px)',
          }}
          key={'back'}
        >
          <IconChevronLeft />
        </ActionIcon>
      )}
      {hasStepForward && (
        <ActionIcon
          component={m.button}
          layout
          initial={{ opacity: 0.05, transform: 'translateX(10px)' }}
          animate={{ opacity: 1, transform: 'translateX(0)' }}
          exit={{
            opacity: 0,
            transform: 'translateX(10px)',
          }}
          key={'forward'}
          onClick={e => {
            e.stopPropagation()
            diagram.navigate('forward')
          }}>
          <IconChevronRight />
        </ActionIcon>
      )}
    </AnimatePresence>
  )
}
