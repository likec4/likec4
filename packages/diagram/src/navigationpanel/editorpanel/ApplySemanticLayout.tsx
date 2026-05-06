import { IconSparkles } from '@tabler/icons-react'
import { memo } from 'react'
import { useDiagram } from '../../hooks/useDiagram'
import { useEditorActorStateHasTag } from '../../hooks/useEditorActor'
import { PanelActionIcon } from '../_common'
import { Tooltip } from './_common'

export const ApplySemanticLayout = memo<{
  visible?: boolean
}>(({
  visible = true,
}) => {
  const diagram = useDiagram()
  const isBusy = useEditorActorStateHasTag('ai-semantic-layout')
  return (
    <Tooltip label="Semantic Layout with AI">
      <PanelActionIcon
        loading={isBusy}
        initial={{
          display: !visible ? 'none' : 'block',
        }}
        animate={{
          display: !visible ? 'none' : 'block',
          opacity: !visible ? 0.2 : 1,
          x: !visible ? -5 : 0,
          y: !visible ? -8 : 0,
        }}
        onClick={(e) => {
          e.stopPropagation()
          diagram.editorActor().send({ type: 'applySemanticLayout' })
        }}>
        <IconSparkles size={14} stroke={2} />
      </PanelActionIcon>
    </Tooltip>
  )
})
ApplySemanticLayout.displayName = 'ApplySemanticLayout'
