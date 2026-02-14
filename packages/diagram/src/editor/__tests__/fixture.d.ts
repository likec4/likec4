import type { Types } from '@likec4/core/builder';
import type { DiagramEdge, DiagramNode, LayoutedElementView } from '@likec4/core/types';
import { type WritableDraft } from 'immer';
import type { LiteralUnion } from 'type-fest';
/**
  Snapshot {@link indexSnapshot} is built from the model below.
=======
specification {
  element el
  element app
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

      app spa {
        #tag-2
        title 'SPA'
        description 'Single Page Application'
        icon tech:react

        -> api
      }
      app pwa {
        #tag-2
        title 'PWA'
        description 'Progressive Web Application'
        icon tech:react

        -> api
      }
    }
    el backend {
      title 'Backend'

      el auth {
        title 'Auth'
        description 'Authentication'
      }

      el api {
        #tag-3
        title 'API'
        description 'REST API'
        icon tech:nodejs
      }

      el worker {
        title 'Worker'
        description 'Background processing'
      }

      api -> auth
      api -> worker
      api -> external.database
      worker -> external.email
    }

    frontend -> api {
      title 'requests'
      technology 'REST'
      description '''
  requests **data**
'''
    }
  }

  el external {
    title 'External'
    description 'External system'

    el email {
      title 'Email'
      description 'Email service'
    }

    el database {
      title 'Database'
      description 'External database'
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

    include
      *,
      saas.**,
      external.**
  }
}

*/
/**
 * Builder that produces the model used to create {@link indexSnapshot}
 * Here for type safety and easy maintenance of the snapshot.
 */
declare function simplebuilder(): any;
type A = Types.ToAux<ReturnType<typeof simplebuilder>['Types']>;
type ExistingNodes = A['ElementId'];
type WithoutNodesEdges<V = LayoutedElementView> = Omit<V, 'nodes' | 'edges'>;
export type NodeIds = LiteralUnion<ExistingNodes, string>;
type NodeUpdater = ((draft: WritableDraft<Omit<DiagramNode, 'id'>>) => void) | Partial<Omit<DiagramNode, 'id'>> | undefined | null;
type NodeIdFrom<N> = N extends infer L extends string ? L | ExistingNodes : ExistingNodes;
type ExistingEdges = 'edge1' | 'edge2' | 'edge3' | 'edge4' | 'edge5' | 'edge6' | 'edge7';
type UpdatableEdge<Node> = Omit<DiagramEdge, 'id' | 'source' | 'target'> & {
    id: LiteralUnion<ExistingEdges, string>;
    source: Node;
    target: Node;
};
type EdgeUpdater<Node> = ((draft: WritableDraft<UpdatableEdge<Node>>) => void) | Partial<UpdatableEdge<Node>> | undefined | null;
export type Patches<N, E> = {
    view?: Partial<WithoutNodesEdges> | ((draft: WritableDraft<WithoutNodesEdges>) => void);
    nodes?: {
        [Id in ExistingNodes]?: NodeUpdater;
    } & {
        [Id in N & string]?: NodeUpdater | undefined | null;
    };
    edges?: {
        [Id in ExistingEdges]?: EdgeUpdater<NodeIdFrom<N>>;
    } & {
        [Id in E & string]?: EdgeUpdater<NodeIdFrom<N>>;
    };
};
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
export declare function prepareFixtures<const N, E>(patcher?: Patches<N, E>): {
    snapshot: LayoutedElementView;
    snapshotNodes: Record<ExistingNodes, DiagramNode>;
    snapshotEdges: Record<ExistingEdges, DiagramEdge>;
    layouted: LayoutedElementView;
    layoutedNodes: {
        [Id in ExistingNodes | N & string]: DiagramNode;
    };
    layoutedEdges: {
        [Id in ExistingEdges | E & string]: DiagramEdge;
    };
};
export {};
