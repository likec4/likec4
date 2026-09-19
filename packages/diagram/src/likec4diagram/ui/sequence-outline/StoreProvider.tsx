import {
  type Atom,
  type ContextFromStoreConfig,
  type SnapshotFromStore,
  type StoreFromStoreLogicCreator,
  createAtom,
  createAtomConfig,
  createReducerAtom,
  createStoreLogic,
  useSelector as useXstateStoreSelector,
  useStore,
} from '@xstate/store-react'
import { shallowEqual } from 'fast-equals'
import { type PropsWithChildren, createContext, use, useEffect, useState } from 'react'

import {
  type StepPath,
  dynamicViewFlow,
  flowAncestors,
  invariant,
  isDynamicViewWithFlow,
} from '@likec4/core'
import { extractViewTitleFromPath } from '@likec4/core/model'
import { selectDiagramContext, useDiagramSelector } from '../../../hooks/safeContext'
import { roundDpr } from '../../../utils'
import { buildTree } from './tree'

const selectFlow = selectDiagramContext((s) => {
  const title = extractViewTitleFromPath(s.view.title ?? 'Untitled')
  const description = s.view.description
  const activeStep = s.activeWalkthrough?.stepId ?? null
  if (activeStep) {
    invariant(isDynamicViewWithFlow(s.view), 'View is not a dynamic view with flow')
    const flow = dynamicViewFlow(s.view)
    const { prev, next } = flow.prevAndNext(
      activeStep,
      ({ id }) => s.collapsedSequenceFlows[id] ?? false,
    )
    const stepNum = s.xyedges.find((e) => e.data.id === activeStep)?.data.stepnum ?? 1
    return {
      flow,
      activeStep,
      stepNum,
      title,
      description,
      outlinePanelWidth: s.activeWalkthrough?.outlinePanelWidth ?? 0,
      collapsed: s.collapsedSequenceFlows,
      prev,
      next,
    }
  }
  return {
    flow: null,
    activeStep: null,
    title,
    description,
  }
})

type SelectFlowResult = Extract<typeof selectFlow.Out, { activeStep: string }>

const logic = createStoreLogic({
  context: ({ input }: { input: SelectFlowResult }) => ({
    ...input,
    ancestors: flowAncestors(input.activeStep),
    outlineTree: buildTree(input.flow),
  }),
  on: {
    updateInput: (context, { input }: { input: SelectFlowResult }) => ({
      ...input,
      ancestors: input.activeStep == context.activeStep ? context.ancestors : flowAncestors(input.activeStep),
      outlineTree: input.flow === context.flow ? context.outlineTree : buildTree(input.flow),
    }),
  },
  selectors: {
    outlinePanelWidth: (context) => roundDpr(context.outlinePanelWidth),
    activeDepth: (context) => context.ancestors.length,
    collapsed: (context) => context.collapsed,
    outlineTree: (context) => context.outlineTree,
  },
})
type SequenceOutlineStore = StoreFromStoreLogicCreator<typeof logic>
type SequenceOutlineStoreContext = SnapshotFromStore<SequenceOutlineStore>['context']

export function StoreProvider({ children }: PropsWithChildren<{}>) {
  const input = useDiagramSelector(selectFlow)
  if (!input.flow) {
    return null
  }

  return (
    <StoreGuard input={input}>
      {children}
    </StoreGuard>
  )
}

const Context = createContext<SequenceOutlineStore>({} as any)

function StoreGuard({ children, input }: PropsWithChildren<{ input: SelectFlowResult }>) {
  const store = useStore(logic, { input })
  useEffect(() => {
    store.trigger.updateInput({ input })
  }, [input])

  useEffect(() => {
    return store.inspect((event) => {
      console.log('event', event)
    }).unsubscribe
  }, [store])

  return (
    <Context value={store}>
      {children}
    </Context>
  )
}

export function useSelectContext<T>(selector: (context: SequenceOutlineStoreContext) => T): T {
  const store = use(Context)
  return useXstateStoreSelector(store, s => selector(s.context), shallowEqual)
}

export function useTrigger() {
  const store = use(Context)
  return store.trigger
}

export function useIsCollapsed(step: StepPath) {
  const store = use(Context)
  return useXstateStoreSelector(store.selectors.collapsed, collapsed => collapsed[step] ?? false)
}

export function useOutlineTree() {
  const store = use(Context)
  return useXstateStoreSelector(store.selectors.outlineTree)
}

export function useOutlinePanelWidth() {
  const store = use(Context)
  return useXstateStoreSelector(store.selectors.outlinePanelWidth)
}
