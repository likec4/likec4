import type { CustomNodes } from '../../custom/customNodes'
import type { Types } from '../types'
import { RelationshipEdge } from './edges/RelationshipEdge'
import { SequenceStepEdge } from './edges/SequenceStepEdge'
import {
  CompoundDeploymentNode,
  CompoundElementNode,
  DeploymentNode,
  ElementNode,
  SequenceActorNode,
  ViewGroupNode,
} from './nodes'

export const BuiltinNodes = {
  element: ElementNode,
  deployment: DeploymentNode,
  compoundElement: CompoundElementNode,
  compoundDeployment: CompoundDeploymentNode,
  viewGroup: ViewGroupNode,
  sequenceActor: SequenceActorNode,
} satisfies Required<CustomNodes>

export { SequenceParallelArea } from './nodes/SequenceActorNode'

export const edgeTypes = {
  relationship: RelationshipEdge,
  'sequence-step': SequenceStepEdge,
} satisfies { [key in Types.Edge['type']]: any }
