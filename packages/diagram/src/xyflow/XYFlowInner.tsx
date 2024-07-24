import { Controls } from '@xyflow/react'
import { shallowEqual } from 'fast-equals'
import { memo, type PropsWithChildren } from 'react'
import { isNonNullish } from 'remeda'
import type { LikeC4DiagramProperties } from '../LikeC4Diagram.props'
import { useDiagramState } from '../state/useDiagramStore'
import { BackwardForwardPanel } from '../ui/BackwardForwardPanel'
import DiagramTitlePanel from '../ui/DiagramTitlePanel'
import { DynamicViewWalkthrough } from '../ui/DynamicViewWalkthrough'
import OptionsPanel from '../ui/OptionsPanel'
import { XYFlowBackground } from './XYFlowBackground'

type XYFlowInnerProps = PropsWithChildren<{
  background: NonNullable<LikeC4DiagramProperties['background']>
  controls: boolean
  showDiagramTitle: boolean
  showNavigationButtons: boolean
}>

export const XYFlowInner = memo(function XYFlowInnerR({
  children,
  background,
  controls,
  showDiagramTitle,
  showNavigationButtons
}: XYFlowInnerProps) {
  const {
    isDynamicView,
    isDynamicViewActive,
    readonly,
    enableDynamicViewWalkthrough
  } = useDiagramState(s => ({
    isDynamicView: s.isDynamicView,
    readonly: s.readonly,
    enableDynamicViewWalkthrough: s.enableDynamicViewWalkthrough,
    isDynamicViewActive: isNonNullish(s.activeDynamicViewStep)
  }))

  const isBgWithPattern = background !== 'transparent' && background !== 'solid'

  const isDiagramTitleVisible = showDiagramTitle === true && !isDynamicViewActive

  return (
    <>
      {isBgWithPattern && <XYFlowBackground background={background} />}
      {controls && <Controls position={'bottom-right'} />}
      {readonly === false && <OptionsPanel />}
      {isDiagramTitleVisible && <DiagramTitlePanel />}
      {isDynamicView && enableDynamicViewWalkthrough && <DynamicViewWalkthrough />}
      {showNavigationButtons && <BackwardForwardPanel />}
      {children}
    </>
  )
}, shallowEqual)
XYFlowInner.displayName = 'XYFlowInner'
