// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { getSmoothStepPath } from '@xyflow/system'
import { EdgeActionButton, EdgeContainer, EdgeLabel, EdgeLabelContainer, EdgePath } from '../../../base-primitives'
import { useEnabledFeatures } from '../../../context/DiagramFeatures'
import { useDiagram } from '../../../hooks/useDiagram'
import type { Types } from '../../types'
import { EdgeDrifts } from './EdgeDrifts'

const LABEL_OFFSET = 16
export function SequenceStepEdge(props: Types.EdgeProps<'seq-step'>) {
  const { enableNavigateTo, enableCompareWithLatest } = useEnabledFeatures()
  const diagram = useDiagram()
  const { navigateTo } = props.data
  const isSelfLoop = props.source === props.target
  const isBack = props.sourceX > props.targetX
  const [path] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
    ...(isSelfLoop && {
      offset: 30,
      borderRadius: 16,
    }),
  })

  let labelX = props.sourceX
  switch (true) {
    case isSelfLoop:
      labelX = props.sourceX + 24 + LABEL_OFFSET
      break
    case isBack:
      labelX = props.sourceX - LABEL_OFFSET
      break
    default:
      labelX = props.sourceX + LABEL_OFFSET
      break
  }

  const { state, stepnum } = props.data

  return (
    <EdgeContainer
      {...props}
      {...state && {
        'data-seq-edge-state': state,
      }}
    >
      <EdgePath
        edgeProps={props}
        svgPath={path}
      />
      {enableCompareWithLatest && <EdgeDrifts edgeProps={props} svgPath={path} />}
      <EdgeLabelContainer
        edgeProps={props}
        labelPosition={{
          x: labelX,
          y: props.sourceY + (!isSelfLoop ? LABEL_OFFSET : 0),
          translate: isBack ? 'translate(-100%, 0)' : undefined,
        }}
      >
        <EdgeLabel edgeProps={props} isSequenceStep stepNum={stepnum}>
          {enableNavigateTo && navigateTo && (
            <EdgeActionButton
              ariaLabel="Navigate to view"
              onClick={e => {
                e.stopPropagation()
                diagram.navigateTo(navigateTo)
              }} />
          )}
        </EdgeLabel>
      </EdgeLabelContainer>
    </EdgeContainer>
  )
}
