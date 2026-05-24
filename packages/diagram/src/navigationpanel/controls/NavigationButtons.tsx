import { hstack } from '@likec4/styles/patterns'
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react'
import * as m from 'motion/react-m'
import { useDiagram, useDiagramSelector } from '../../hooks/useDiagram'
import { PanelActionIcon } from '../_common'

export const NavigationButtons = () => {
  const diagram = useDiagram()
  const {
    hasStepBack,
    hasStepForward,
  } = useDiagramSelector(s => ({
    hasStepBack: s.context.navigationHistory.currentIndex > 0,
    hasStepForward: s.context.navigationHistory.currentIndex < s.context.navigationHistory.history.length - 1,
  }))
  return (
    <m.div
      layout="position"
      className={hstack({
        gap: '0.5',
      })}>
      <PanelActionIcon
        disabled={!hasStepBack}
        onClick={e => {
          e.stopPropagation()
          diagram.navigate('back')
        }}>
        <IconArrowLeft size={14} />
      </PanelActionIcon>
      <PanelActionIcon
        disabled={!hasStepForward}
        onClick={e => {
          e.stopPropagation()
          diagram.navigate('forward')
        }}>
        <IconArrowRight size={14} />
      </PanelActionIcon>
    </m.div>
  )
}
