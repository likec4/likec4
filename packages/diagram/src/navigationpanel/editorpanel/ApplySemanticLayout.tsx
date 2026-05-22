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
          display: visible ? 'block' : 'none',
        }}
        animate={{
          display: visible ? 'block' : 'none',
          opacity: visible ? 1 : 0.2,
          x: visible ? 0 : -5,
          y: visible ? 0 : -8,
        }}
        onClick={(e) => {
          e.stopPropagation()
          diagram.editorActor().send({ type: 'change.semantic-layout' })
        }}>
        <IconSparkles size={14} stroke={2} />
      </PanelActionIcon>
    </Tooltip>
  )
})
ApplySemanticLayout.displayName = 'ApplySemanticLayout'
