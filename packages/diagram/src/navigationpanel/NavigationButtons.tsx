import { hstack } from '@likec4/styles/patterns'
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react'
import * as m from 'motion/react-m'
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
    <m.div layout="position" className={hstack({ gap: 1 })}>
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
        children={<IconArrowLeft size={14} />}
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
        children={<IconArrowRight size={14} />}
      />
    </m.div>
  )
}
