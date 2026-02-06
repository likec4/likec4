import { type LayoutedElementView, type ViewId, nonNullable } from '@likec4/core'
import { useSelector } from '@xstate/react'
import { shallowEqual } from 'fast-equals'
import { createContext, useContext, useMemo } from 'react'
import type { AdhocEditorActorRef, AdhocEditorSnapshot } from './state/actor'

const AdhocEditorActorContext = createContext<AdhocEditorActorRef | null>(null)
export const AdhocEditorActorContextProvider = AdhocEditorActorContext.Provider

export function useAdhocEditorActor() {
  return nonNullable(useContext(AdhocEditorActorContext), 'No AdhocEditorActorContext')
}

export function useAdhocEditor() {
  const actorRef = useAdhocEditorActor()
  return useMemo(() => ({
    open: () => actorRef.send({ type: 'select.open' }),
    close: () => actorRef.send({ type: 'select.close' }),
    toggleRule: (ruleId: string) => actorRef.send({ type: 'toggle.rule', ruleId }),
    // include: (element: ElementModel) => actorRef.send({ type: 'include.element', model: element.id }),
  }), [actorRef])
}

export function useAdhocEditorSnapshot<T = unknown>(
  selector: (state: AdhocEditorSnapshot) => T,
  compare: (a: NoInfer<T>, b: NoInfer<T>) => boolean = shallowEqual,
) {
  const actorRef = useAdhocEditorActor()
  return useSelector(actorRef, selector, compare)
}

const EMPTY_VIEW: LayoutedElementView = {
  id: 'adhoc' as ViewId,
  ['_type']: 'element',
  autoLayout: { direction: 'LR' },
  nodes: [],
  edges: [],
  bounds: { x: 0, y: 0, width: 0, height: 0 },
  ['_stage']: 'layouted',
  title: null,
  description: null,
  hash: '',
}
const selectView = ({ context }: AdhocEditorSnapshot) => context.view ?? EMPTY_VIEW
export function useAdhocView() {
  const actorRef = useAdhocEditorActor()
  return useSelector(actorRef, selectView)
}

export function selectFromSnapshot<T = unknown>(selector: (state: AdhocEditorSnapshot) => T) {
  return selector
}
export function selectFromContext<T = unknown>(selector: (state: AdhocEditorSnapshot['context']) => T) {
  return (state: AdhocEditorSnapshot) => selector(state.context)
}
