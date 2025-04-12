import { IconLock, IconLockOpen2 } from '@tabler/icons-react'
import { useDiagram, useDiagramContext } from '../../../hooks/useDiagram'
import type { DiagramContext } from '../../../state/types'
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
