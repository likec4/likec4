import { type WritableDraft, produce } from 'immer'
import { filter, indexBy, isTruthy, map, pipe } from 'remeda'
import type { IsEqual, IsLiteral, IsStringLiteral, LiteralUnion, SetRequired } from 'type-fest'
import type { Types } from '../../builder/_types'
import { Builder } from '../../builder/Builder'
import type { DiagramEdge, DiagramNode, EdgeId, LayoutedElementView, NodeId } from '../../types'
import type { ViewManualLayoutSnapshot } from '../../types/view-manual-layout'
import indexSnapshot from './index-snapshot.json' assert { type: 'json' }

/**
  Snapshot {@link indexSnapshot} is built from the model below.
=======

specification {
  element el
  tag tag-1
  tag tag-2
  tag tag-3
}

model {
  el customer 'Customer' {
    #tag-1 #tag-2
    description 'Uses services online'
  }

  el saas {
    #tag-1
    title 'SaaS Application'
    description 'Provides online services to customers'

    el frontend {
      #tag-2
      title 'Frontend'
      description 'React web application'
      icon tech:react
    }
    el api {
      #tag-3
      title 'API'
      description 'REST API'
      icon tech:nodejs
    }
    frontend -> api {
      title 'requests'
      technology 'REST'
      description '''
  requests **data**
'''
    }
  }

  customer -> saas.frontend 'uses'

}

views {
  view index {
    title 'Landscape'
    description '''
      System _Landscape_

    '''

    include *, saas.*
  }
}
*/

/**
 * Builder that produces the model used to create {@link indexSnapshot}
 * Here for type safety and easy maintenance of the snapshot.
 */
function simplebuilder() {
  return Builder
    .specification({
      elements: {
        el: {},
      },
      tags: {
        'tag-1': {},
        'tag-2': {},
        'tag-3': {},
      },
    })
    .model(({ el, rel }, _) =>
      _(
        el('customer', {
          title: 'Customer',
          description: 'Uses services online',
          tags: ['tag-1', 'tag-2'],
        }),
        el('saas', {
          title: 'SaaS Application',
          description: 'Provides online services to customers',
          tags: ['tag-1'],
        }).with(
          el('frontend', {
            title: 'Frontend',
            description: 'React web application',
            icon: 'tech:react',
            tags: ['tag-2'],
          }),
          el('api', {
            title: 'API',
            description: 'REST API',
            icon: 'tech:nodejs',
            tags: ['tag-3'],
          }),
        ),
        rel('saas.frontend', 'saas.api', {
          title: 'requests',
          technology: 'REST',
          description: 'requests data',
        }),
        rel('customer', 'saas.frontend', {
          title: 'uses',
          notes: 'Initial note',
        }),
      )
    )
    .views(({ view, $include }, _) =>
      _(
        view('index', {
          title: 'Landscape',
          description: 'System Landscape',
        }).with(
          $include('*'),
          $include('saas.*'),
        ),
      )
    )
}

type A = Types.ToAux<ReturnType<typeof simplebuilder>['Types']>
type ExistingNodes = A['ElementId']
type WithoutNodesEdges<V = LayoutedElementView> = Omit<V, 'nodes' | 'edges'>
export type NodeIds = LiteralUnion<ExistingNodes, string>
type NodeUpdater =
  | ((draft: WritableDraft<Omit<DiagramNode, 'id'>>) => void)
  | Partial<Omit<DiagramNode, 'id'>>
  | undefined
  | null

type NodeIdFrom<N> = N extends infer L extends string ? L | ExistingNodes : ExistingNodes

type ExistingEdges =
  | 'edge1'
  | 'edge2'

type UpdatableEdge<Node> = Omit<DiagramEdge, 'id' | 'source' | 'target'> & {
  id: LiteralUnion<ExistingEdges, string>
  source: Node
  target: Node
}

type EdgeUpdater<Node> =
  | ((draft: WritableDraft<UpdatableEdge<Node>>) => void)
  | Partial<UpdatableEdge<Node>>
  | undefined
  | null

export type Patches<N, E> = {
  view?: Partial<WithoutNodesEdges> | ((draft: WritableDraft<WithoutNodesEdges>) => void)
  nodes?:
    & {
      [Id in ExistingNodes]?: NodeUpdater
    }
    & {
      [Id in N & string]?: NodeUpdater | undefined | null
    }

  edges?:
    & {
      [Id in ExistingEdges]?: EdgeUpdater<NodeIdFrom<N>>
    }
    & {
      [Id in E & string]?: EdgeUpdater<NodeIdFrom<N>>
    }
  // & {
  //   [Id in E & EdgeIds<ExistingNodes | NoInfer<N> & string>]?: EdgeUpdater<ExistingNodes | NoInfer<N>>
  //   // dprint-ignore
  //   // Id extends EdgeIds<NodeIdFrom<N>>
  //   //  ? EdgeUpdater<ExistingNodes | NoInfer<N> & string>
  //   //  : never
  // }
}

function patch<A>(obj: A, patcher?: ((draft: WritableDraft<NoInfer<A>>) => void) | Partial<NoInfer<A>>): A {
  if (!patcher) {
    return obj
  }
  if (typeof patcher === 'function') {
    return produce(obj, patcher)
  } else {
    return {
      ...obj,
      ...patcher,
    }
  }
}

/**
 * Helper to get a fixture with manual layout snapshot, and auto layouted view.
 * It takes {@link indexSnapshot} as base, applies provided patches
 * to return as auto-layouted.
 *
 * Patcher can modify view properties, nodes and edges by their ids.
 *
 * Nodes/Edges can be modified, removed (by setting to null/undefined), or added (by using new key).
 *
 * @example
 * const { snapshot, layouted } = prepareFixtures({
 *   nodes: {
 *     // Merge changes to the node
 *     'customer': {
 *       x: 100,
 *     },
 *     // Apply changes to existing node via immer
 *     'saas.api': d => {
 *       d.color = 'secondary'
 *     },
 *     // Remove node from snapshot
 *    'saas.frontend': null,
 *    // Add new node to layouted View
 *    'another': d => {
 *      d.title = 'Another Node'
 *   },
 *   edges: {
 *     // Merge changes to existing edge
 *     'edge1: customer to frontend': d => {
 *        d.source = 'another'
 *     },
 *     // Delete existing edge
 *    'edge2: frontend to api': null,
 *     // Add new edge (TS will check source/target ids)
 *     'customer -> another': {
 *       label: 'New Edge',
 *       source: 'customer',
 *       target: 'another',
 *     }
 *   }
 * }

 * })
 */
export function prepareFixtures<const N, E>(patcher?: Patches<N, E>): {
  snapshot: ViewManualLayoutSnapshot
  snapshotNodes: Record<ExistingNodes, DiagramNode>
  snapshotEdges: Record<ExistingEdges, DiagramEdge>
  layouted: LayoutedElementView
  layoutedNodes: {
    [Id in ExistingNodes | N & string]: DiagramNode
  }
  layoutedEdges: {
    [Id in ExistingEdges | E & string]: DiagramEdge
  }
} {
  const snapshot = structuredClone(indexSnapshot) as unknown as ViewManualLayoutSnapshot<'element'>

  let layouted = {
    ...patch(
      structuredClone(snapshot),
      patcher?.view,
    ),
  }

  if (patcher?.nodes) {
    const patchNodes = {
      ...patcher.nodes,
    }
    layouted.nodes = pipe(
      layouted.nodes,
      filter(n => !(n.id in patchNodes) || isTruthy(patchNodes[n.id as ExistingNodes])),
      map(n => {
        const nodePatcher = patchNodes[n.id as ExistingNodes]
        if (nodePatcher) {
          delete patchNodes[n.id as ExistingNodes]
          return patch(n, nodePatcher)
        }
        return n
      }),
    )
    // Add any remaining nodes in patchNodes that were not in the original snapshot
    for (const [id, patcher] of Object.entries(patchNodes)) {
      if (isTruthy(patcher)) {
        const baseNode: DiagramNode = {
          id: id as NodeId,
          title: 'New Node',
          parent: null,
          children: [],
          inEdges: [],
          outEdges: [],
          x: 0,
          y: 0,
          width: 300,
          height: 200,
          kind: 'component',
          color: 'primary',
          shape: 'rectangle',
          style: {},
          level: 0,
          tags: [],
          labelBBox: { x: 0, y: 0, width: 0, height: 0 },
        }
        layouted.nodes.push(patch(baseNode, patcher))
      }
    }
  }

  if (patcher?.edges) {
    const patchEdges = {
      ...patcher.edges,
    }
    layouted.edges = pipe(
      layouted.edges,
      filter(n => !(n.id in patchEdges) || isTruthy(patchEdges[n.id as ExistingEdges])),
      map(n => {
        const edgePatcher = patchEdges[n.id as ExistingEdges]
        if (edgePatcher) {
          delete patchEdges[n.id as ExistingEdges]
          return patch(n, edgePatcher as any)
        }
        return n
      }),
    )
    // Add any remaining edges in patchEdges that were not in the original snapshot
    for (const [id, patcher] of Object.entries(patchEdges)) {
      if (isTruthy(patcher)) {
        const baseEdge: DiagramEdge = {
          id: id as EdgeId,
          parent: null,
          source: 'customer' as NodeId,
          target: 'saas' as NodeId,
          label: `New Edge: ${id}`,
          labelBBox: { x: 10, y: 20, width: 100, height: 200 },
          technology: null,
          description: null,
          color: 'primary',
          line: 'solid',
          points: [
            [0, 0],
            [100, 100],
          ],
          relations: [],
        }
        layouted.edges.push(patch(baseEdge, patcher as any))
      }
    }
  }

  return {
    snapshot,
    snapshotNodes: indexBy(snapshot.nodes, n => n.id),
    snapshotEdges: indexBy(snapshot.edges, e => e.id),
    layouted,
    layoutedNodes: indexBy(layouted.nodes, n => n.id) as any,
    layoutedEdges: indexBy(layouted.edges, e => e.id) as any,
  } as any
}
