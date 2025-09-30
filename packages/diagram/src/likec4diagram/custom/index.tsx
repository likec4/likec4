import { RelationshipEdge } from './edges/RelationshipEdge'
import { SequenceStepEdge } from './edges/SequenceStepEdge'
import {
  CompoundDeploymentNode,
  CompoundElementNode,
  DeploymentNode,
  ElementNode,
  SequenceActorNode,
  SequenceParallelArea,
  ViewGroupNode,
} from './nodes'

export const BuiltinNodes = {
  ElementNode,
  DeploymentNode,
  CompoundElementNode,
  CompoundDeploymentNode,
  ViewGroupNode,
  SequenceActorNode,
  SequenceParallelArea,
}

export const BuiltinEdges = {
  RelationshipEdge,
  SequenceStepEdge,
}
