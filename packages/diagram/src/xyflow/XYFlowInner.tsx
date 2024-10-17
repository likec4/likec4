import { shallowEqual } from 'fast-equals'
import { memo } from 'react'
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
  showDiagramTitle: boolean
}

export const XYFlowInner = /* @__PURE__ */ memo(function XYFlowInnerR({
  background,
  showDiagramTitle
}: XYFlowInnerProps) {
  const {
    showNotations,
    isDynamicView,
    showTopLeft,
    isDynamicViewActive,
    enableDynamicViewWalkthrough
  } = useDiagramState(s => ({
    showNotations: s.showNotations,
    isDynamicView: s.isDynamicView,
    showTopLeft: s.controls || (s.showNavigationButtons && !!s.onNavigateTo) || !!s.onBurgerMenuClick,
    enableDynamicViewWalkthrough: s.enableDynamicViewWalkthrough,
    isDynamicViewActive: isNonNullish(s.activeWalkthrough)
  }))

  const isBgWithPattern = background !== 'transparent' && background !== 'solid'

  const isDiagramTitleVisible = showDiagramTitle && !isDynamicViewActive
  return (
    <>
      {isBgWithPattern && <XYFlowBackground background={background} />}
      {showTopLeft && <TopLeftPanel />}
      {isDiagramTitleVisible && <DiagramTitlePanel />}
      {isDynamicView && enableDynamicViewWalkthrough && <DynamicViewWalkthrough />}
      {showNotations && <NotationPanel />}
    </>
  )
}, shallowEqual)
XYFlowInner.displayName = 'XYFlowInner'
