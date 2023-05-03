import type { Fqn, RelationID, ViewID } from '@likec4/core'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

type EditorStateStore = {
  revealRequest: null | EditorRevealRequest
}

export type EditorRevealRequest =
  | { element: Fqn }
  | { view: ViewID }
  | { relation: RelationID }


export const useEditorState = create<EditorStateStore>()(
  devtools(
    (_set, _get) => {
      return {
        revealRequest: null,
      }
    },
    {
      name: 'diagram-store',
      trace: true,
    }
  )
)

export function revealInEditor(revealRequest: EditorRevealRequest) {
  useEditorState.setState({revealRequest}, true, 'reveal-request')
}
