import { Controls } from '@xyflow/react'
import { shallowEqual } from 'fast-equals'
import { memo, type PropsWithChildren } from 'react'
import { isNonNullish } from 'remeda'
import { useDiagramState } from '../hooks/useDiagramState'
import type { LikeC4DiagramProperties } from '../LikeC4Diagram.props'
import DiagramTitlePanel from '../ui/DiagramTitlePanel'
import { DynamicViewWalkthrough } from '../ui/DynamicViewWalkthrough'
import NotationPanel from '../ui/notation'
import { TopLeftPanel } from '../ui/top-left/TopLeftPanel'
import { XYFlowBackground } from './XYFlowBackground'

type XYFlowInnerProps = {
  background: NonNullable<LikeC4DiagramProperties['background']>
  controls: boolean
  showDiagramTitle: boolean
}

export const XYFlowInner = /* @__PURE__ */ memo(function XYFlowInnerR({
  background,
  controls,
  showDiagramTitle
}: XYFlowInnerProps) {
  const {
    showNotations,
    isDynamicView,
    isDynamicViewActive,
    enableDynamicViewWalkthrough
  } = useDiagramState(s => ({
    showNotations: s.showNotations,
    isDynamicView: s.isDynamicView,
    enableDynamicViewWalkthrough: s.enableDynamicViewWalkthrough,
    isDynamicViewActive: isNonNullish(s.activeWalkthrough)
  }))

  const isBgWithPattern = background !== 'transparent' && background !== 'solid'

  const isDiagramTitleVisible = showDiagramTitle && !isDynamicViewActive
  return (
    <>
      {isBgWithPattern && <XYFlowBackground background={background} />}
      {controls && <Controls showInteractive={false} position={'top-center'} />}
      <TopLeftPanel />
      {isDiagramTitleVisible && <DiagramTitlePanel />}
      {isDynamicView && enableDynamicViewWalkthrough && <DynamicViewWalkthrough />}
      {showNotations && <NotationPanel />}
    </>
  )
}, shallowEqual)
XYFlowInner.displayName = 'XYFlowInner'
