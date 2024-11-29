import type { EdgeId, Fqn, Relation } from '../../types'
import type { DeploymentNode, DeploymentRelation } from '../../types/deployments'
import { commonAncestor, hierarchyDistance, stringHash } from '../../utils'
import { LikeC4DeploymentGraph } from '../LikeC4DeploymentGraph'

export type Node = LikeC4DeploymentGraph.Instance | DeploymentNode

export type EdgeRelation = Relation | DeploymentRelation

export function edgeId(source: Node, target: Node): EdgeId {
  return stringHash(`${source.id} -> ${target.id}`) as EdgeId
}

export class Edge {
  public readonly id: EdgeId
  public readonly commonAncestor: Fqn | null

  public readonly distance: number

  constructor(
    public readonly source: Node,
    public readonly target: Node,
    public relations: Set<EdgeRelation>
  ) {
    this.id = edgeId(source, target)
    this.commonAncestor = commonAncestor(source.id, target.id)
    this.distance = hierarchyDistance(source.id, target.id)
  }
}

export type Edges = ReadonlyArray<Edge>
