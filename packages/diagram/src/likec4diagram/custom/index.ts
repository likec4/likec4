import type { CustomNodes } from '../../custom/customNodes'
import type { Types } from '../types'
import { RelationshipEdge } from './edges/RelationshipEdge'
import {
  CompoundDeploymentNode,
  CompoundElementNode,
  DeploymentNode,
  ElementNode,
  ViewGroupNode,
} from './nodes/nodes'

export const BuiltinNodes = {
  element: ElementNode,
  deployment: DeploymentNode,
  compoundElement: CompoundElementNode,
  compoundDeployment: CompoundDeploymentNode,
  viewGroup: ViewGroupNode,
} satisfies Required<CustomNodes>

export const edgeTypes = {
  relationship: RelationshipEdge,
} satisfies { [key in Types.Edge['type']]: any }
