import { StraightEdge } from '@xyflow/react'
import type { EdgeProps } from '../../../base'
import type { SequenceViewTypes } from '../_types'

export function StepEdge(props: EdgeProps<SequenceViewTypes.StepEdge>) {
  return <StraightEdge {...props} />
}
