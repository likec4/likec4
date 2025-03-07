import type { Types } from '../types'
import { RelationshipEdge } from './edges/RelationshipEdge'
import {
  CompoundDeploymentNode,
  CompoundElementNode,
  DeploymentNode,
  ElementNode,
  ViewGroupNode,
} from './nodes/nodeTypes'

export const nodeTypes = {
  element: ElementNode,
  deployment: DeploymentNode,
  'compound-element': CompoundElementNode,
  'compound-deployment': CompoundDeploymentNode,
  'view-group': ViewGroupNode,
} satisfies { [key in Types.Node['type']]: any }

export const edgeTypes = {
  relationship: RelationshipEdge,
} satisfies { [key in Types.Edge['type']]: any }
