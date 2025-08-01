import { IconChevronRight } from '@tabler/icons-react'

import { m } from 'motion/react'

import { HStack } from '@likec4/styles/jsx'
import { IconChevronLeft } from '@tabler/icons-react'
import { useDiagram, useDiagramContext } from '../hooks/useDiagram'
import { PanelActionIcon } from './_common'

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
    <HStack gap={1}>
      <PanelActionIcon
        disabled={!hasStepBack}
        variant="subtle"
        component={m.button}
        whileHover={{
          scale: 1.085,
        }}
        whileTap={{
          scale: 1,
          translateY: 1,
        }}
        onClick={e => {
          e.stopPropagation()
          diagram.navigate('back')
        }}
        children={<IconChevronLeft stroke={3} />}
      />
      <PanelActionIcon
        disabled={!hasStepForward}
        variant="subtle"
        component={m.button}
        whileHover={{
          scale: 1.085,
        }}
        whileTap={{
          scale: 1,
          translateY: 1,
        }}
        onClick={e => {
          e.stopPropagation()
          diagram.navigate('forward')
        }}
        children={<IconChevronRight stroke={3} />}
      />
    </HStack>
  )
}
