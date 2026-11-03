import { useEffect, useState } from 'react'
import type { EditorActorRef } from '../editor/actor/machine'
import type { EditorActorStateTag } from '../editor/actor/types'
import { selectDiagramSnapshot, useDiagramSelector } from './useDiagram'

const select = selectDiagramSnapshot(
  s => s.children.editor ?? null,
  Object.is,
)

export function useEditorActorRef(): EditorActorRef | null {
  return useDiagramSelector(select)
}

export function useEditorActorStateHasTag(tag: EditorActorStateTag) {
  const editorActor = useEditorActorRef()
  const [hasTag, setHasTag] = useState(() => editorActor?.getSnapshot().hasTag(tag) ?? false)
  useEffect(() => {
    const subscription = editorActor?.select(s => s.hasTag(tag)).subscribe(hasTag => {
      setHasTag(hasTag)
    })
    return () => {
      subscription?.unsubscribe()
      setHasTag(false)
    }
  }, [editorActor, tag])
  return hasTag
}
