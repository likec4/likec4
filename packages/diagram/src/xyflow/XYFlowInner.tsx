import { isDynamicView } from '@likec4/core'
import { Controls } from '@xyflow/react'
import type { PropsWithChildren } from 'react'
import { isNonNull, isNonNullish, isNullish } from 'remeda'
import type { LikeC4DiagramProperties } from '../LikeC4Diagram.props'
import { useDiagramState } from '../state/useDiagramStore'
import { DynamicViewWalkthrough } from '../ui'
import DiagramTitlePanel from '../ui/DiagramTitlePanel'
import OptionsPanel from '../ui/OptionsPanel'
import { XYFlowBackground } from './XYFlowBackground'

type XYFlowInnerProps = PropsWithChildren<{
  background: NonNullable<LikeC4DiagramProperties['background']>
  controls: boolean
  showDiagramTitle: boolean
  enableDynamicViewWalkthrough: boolean
}>

export function XYFlowInner({
  children,
  background,
  controls,
  showDiagramTitle,
  enableDynamicViewWalkthrough
}: XYFlowInnerProps) {
  const {
    isDynamicView,
    isDynamicViewActive,
    readonly
  } = useDiagramState(s => ({
    isDynamicView: s.isDynamicView(),
    readonly: s.readonly,
    isDynamicViewActive: isNonNull(s.activeDynamicViewStep)
  }))

  const isBgWithPattern = background !== 'transparent' && background !== 'solid'

  const isDiagramTitleVisible = !isDynamicViewActive && showDiagramTitle === true

  return (
    <>
      {isBgWithPattern && <XYFlowBackground background={background} />}
      {controls && <Controls position={'bottom-right'} />}
      {readonly === false && <OptionsPanel />}
      {isDiagramTitleVisible && <DiagramTitlePanel />}
      {isDynamicView && enableDynamicViewWalkthrough && <DynamicViewWalkthrough />}
      {children}
    </>
  )
}
