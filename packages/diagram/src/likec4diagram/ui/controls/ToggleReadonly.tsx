import { IconLock, IconLockOpen2 } from '@tabler/icons-react'
import { useDiagram } from '../../../hooks/useDiagram'
import { useDiagramContext } from '../../../hooks/useDiagramContext'
import type { DiagramContext } from '../../state/machine'
import { ActionIcon, Tooltip } from './_shared'

const selector = (state: DiagramContext) => ({
  visible: state.features.enableReadOnly !== true,
  isReadOnly: state.toggledFeatures.enableReadOnly ?? state.features.enableReadOnly,
})

export const ToggleReadonly = () => {
  const { visible, isReadOnly } = useDiagramContext(selector)
  const diagram = useDiagram()

  if (!visible) {
    return null
  }

  return (
    <Tooltip label={isReadOnly ? 'Enable editing' : 'Disable editing'}>
      <ActionIcon
        onClick={e => {
          e.stopPropagation()
          diagram.toggleFeature('ReadOnly')
        }}>
        {isReadOnly ? <IconLock /> : <IconLockOpen2 />}
      </ActionIcon>
    </Tooltip>
  )
}
