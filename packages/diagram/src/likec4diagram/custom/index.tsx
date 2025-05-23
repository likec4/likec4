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

// export const nodeTypes = {
//   element: customElementNode(({ nodeProps, nodeModel }) => {
//     return <ElementNode {...nodeProps} />
//   }),
//   deployment: customDeploymentNode(({ nodeProps, nodeModel }) => {
//     return <DeploymentNode {...nodeProps} />
//   }),
//   'compound-element': customCompoundElementNode(({ nodeProps, nodeModel }) => {
//     return <CompoundElementNode {...nodeProps} />
//   }),
//   'compound-deployment': customCompoundDeploymentNode(({ nodeProps, nodeModel }) => {
//     return <CompoundDeploymentNode {...nodeProps} />
//   }),
//   'view-group': customViewGroupNode(({ nodeProps, nodeModel }) => {
//     return <ViewGroupNode {...nodeProps} />
//   }),
// } satisfies CustomNodes

export const edgeTypes = {
  relationship: RelationshipEdge,
} satisfies { [key in Types.Edge['type']]: any }
