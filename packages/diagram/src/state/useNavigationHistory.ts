import { useStateHistory } from '@mantine/hooks'
import { useMemo } from 'react'
import { useUpdateEffect } from '../hooks/useUpdateEffect'
import { useDiagramState, useDiagramStoreApi } from './useDiagramStore'

export function useNavigationHistory() {
  const store = useDiagramStoreApi()
  const viewId = useDiagramState(s => s.view.id)

  const [historyViewId, historyOps, {
    history,
    current: historyIndex
  }] = useStateHistory(viewId)

  const hasBack = historyIndex > 0
  const hasForward = historyIndex < history.length - 1

  useUpdateEffect(() => {
    if (viewId !== historyViewId) {
      historyOps.set(viewId)
    }
  }, [viewId])

  useUpdateEffect(() => {
    if (viewId !== historyViewId) {
      store.getState().onNavigateTo?.(historyViewId)
    }
  }, [historyViewId])

  return useMemo(() => ({
    hasBack,
    hasForward,
    ops: historyOps
  }), [
    hasBack,
    hasForward,
    historyOps
  ])
}
