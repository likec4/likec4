import { ViewId } from '@likec4/core/types'
import { useUpdateEffect } from '@react-hookz/web'
import { useActorRef, useSelector as useXstateSelector } from '@xstate/react'
import { shallowEqual } from 'fast-equals'
import { type DependencyList, type PropsWithChildren, createContext, useCallback, useContext } from 'react'
import { useDiagramActorRef } from '../../../hooks/safeContext'
import { useCurrentViewModel } from '../../../likec4model/useCurrentViewModel'
import type {
  BreadcrumbsActorRef,
  BreadcrumbsActorSnapshot,
  BreadcrumbsContext,
} from './actor'
import { breadcrumbsActorLogic } from './actor'

const BreadcrumbsActorSafeContext = createContext<BreadcrumbsActorRef>(null as any)
BreadcrumbsActorSafeContext.displayName = 'BreadcrumbsActorSafeContext'

export function BreadcrumbsActorContext({ children }: PropsWithChildren) {
  const diagramActor = useDiagramActorRef()
  const viewModel = useCurrentViewModel()

  const breadcrumbsActorRef = useActorRef(
    breadcrumbsActorLogic.provide({
      actions: {
        'trigger navigateTo': (_ctx, params) => {
          diagramActor.send({ type: 'navigate.to', viewId: ViewId(params.viewId) })
        },
      },
    }),
    {
      input: {
        viewModel,
      },
    },
  )

  useUpdateEffect(() => {
    breadcrumbsActorRef.send({ type: 'update.inputs', inputs: { viewModel } })
  }, [viewModel])

  return (
    <BreadcrumbsActorSafeContext.Provider value={breadcrumbsActorRef}>
      {children}
    </BreadcrumbsActorSafeContext.Provider>
  )
}

export const useBreadcrumbsActorRef = () => {
  const ctx = useContext(BreadcrumbsActorSafeContext)
  if (ctx === null) {
    throw new Error('DiagramActorRef is not provided')
  }
  return ctx
}

/**
 * Read breadcrumbs actor context
 */
export function useBreadcrumbsActorSnapshot<T = unknown>(
  selector: (context: BreadcrumbsActorSnapshot) => T,
  compare: (a: NoInfer<T>, b: NoInfer<T>) => boolean = shallowEqual,
  deps?: DependencyList,
): T {
  const actorRef = useBreadcrumbsActorRef()
  const select = useCallback(selector, deps ?? [])
  return useXstateSelector(actorRef, select, compare)
}

/**
 * Read breadcrumbs actor context
 */
export function useBreadcrumbsContext<T = unknown>(
  selector: (context: BreadcrumbsContext) => T,
  compare: (a: NoInfer<T>, b: NoInfer<T>) => boolean = shallowEqual,
  deps?: DependencyList,
): T {
  return useBreadcrumbsActorSnapshot(snapshot => selector(snapshot.context), compare, deps)
}
