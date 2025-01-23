import type { Types } from '../types'
import { RelationshipEdge } from './edges/RelationshipEdge'

export { nodeTypes } from './nodes/nodeTypes'

export const edgeTypes = {
  relationship: RelationshipEdge,
} satisfies { [key in Types.Edge['type']]: any }
