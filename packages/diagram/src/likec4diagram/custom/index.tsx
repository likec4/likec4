import { RelationshipEdge } from './edges/RelationshipEdge'
import { SequenceStepEdge } from './edges/SequenceStepEdge'
import {
  CompoundDeploymentNode,
  CompoundElementNode,
  DeploymentNode,
  ElementNode,
  SequenceActorNode,
  SequenceParallelArea,
  SequenceSubflowArea,
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
  SequenceSubflowArea,
}

export const BuiltinEdges = {
  RelationshipEdge,
  SequenceStepEdge,
}
