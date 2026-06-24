import { ActivationBar } from '../xyflow-sequence/components/ActivationBar'
import { FrameBgNode, FrameNode } from '../xyflow-sequence/components/FrameNode'
import { LifelineNode } from '../xyflow-sequence/components/LifelineNode'
import { NoteNode } from '../xyflow-sequence/components/NoteNode'
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
  SequenceFrameNode: FrameNode,
  SequenceFrameBgNode: FrameBgNode,
  SequenceLifelineNode: LifelineNode,
  SequenceNoteNode: NoteNode,
  SequenceActivationNode: ActivationBar,
}

export const BuiltinEdges = {
  RelationshipEdge,
  SequenceStepEdge,
}
