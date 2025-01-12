import { useDebouncedEffect } from '@react-hookz/web'
import { memo, useRef, useState } from 'react'
import { useXYStore } from '../hooks'
import { type Context, type StoreSnapshot, useDiagramContext } from './store'
import { useDiagram } from './useDiagram'

function selectXYFlowSize(state: { width: number; height: number }): string {
  return `${Math.round(state.width)}:${Math.round(state.height)}`
}

function selectDiagramsize({ view, fitViewPadding }: Context) {
  return [
    view.bounds.x,
    view.bounds.y,
    view.bounds.width,
    view.bounds.height,
    fitViewPadding,
  ].map(Math.round).join(':')
}

function FitViewOnViewportResize() {
  const { fitDiagram, actor } = useDiagram()
  const xyflowsize = useXYStore(selectXYFlowSize)
  const viewsize = useDiagramContext(selectDiagramsize)
  const dimensions = xyflowsize + viewsize
  const prevDimensionsRef = useRef(dimensions)

  useDebouncedEffect(
    () => {
      // const { fitDiagram } = diagramApi.getState()
      if (prevDimensionsRef.current === dimensions) {
        return
      }
      prevDimensionsRef.current = dimensions
      fitDiagram(250)
    },
    [dimensions, fitDiagram],
    250,
  )

  return null
}

function selector({ view, fitViewPadding, viewportChangedManually }: Context) {
  return {
    layoutId: view.id + '_' + view.autoLayout + '_' + fitViewPadding,
    viewportNotMoved: !viewportChangedManually,
    // TODO: implement activeWalkthrough
    isActiveWalkthrough: false,
  }
}

/**
 * Fits the view when diagram changes
 */
export const FitViewOnDiagramChange = memo(() => {
  const { fitDiagram, actor } = useDiagram()
  const { layoutId, viewportNotMoved, isActiveWalkthrough } = useDiagramContext(selector)

  const [currentLayoutId, setCurrent] = useState(layoutId)

  const requiresFit = layoutId !== currentLayoutId
  useDebouncedEffect(
    () => {
      if (layoutId === currentLayoutId) {
        return
      }
      setCurrent(layoutId)
      fitDiagram(450)
    },
    [requiresFit, fitDiagram],
    50,
  )

  if (viewportNotMoved && !isActiveWalkthrough && !requiresFit) {
    return <FitViewOnViewportResize />
  }
  return null
})
