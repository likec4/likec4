import { hstack } from '@likec4/styles/patterns'
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react'
import * as m from 'motion/react-m'
import { useDiagram, useDiagramContext } from '../../hooks/useDiagram'
import { PanelActionIcon } from '../_common'

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
