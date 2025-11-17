// Snapshot is built from the model
/*

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

import { type WritableDraft, produce } from 'immer'
import { filter, isTruthy, map, pipe } from 'remeda'
import type { LiteralUnion } from 'type-fest'
import type { Types } from '../../builder/_types'
import { Builder } from '../../builder/Builder'
import type { DiagramNode, LayoutedElementView, NodeId } from '../../types'
import type { ViewManualLayoutSnapshot } from '../../types/view-manual-layout'
import indexSnapshot from './index-snapshot.json' assert { type: 'json' }

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

type NodeUpdater = ((draft: WritableDraft<Omit<DiagramNode, 'id'>>) => void) | Partial<Omit<DiagramNode, 'id'>>

export type Patches = {
  view?: Partial<WithoutNodesEdges> | ((draft: WritableDraft<WithoutNodesEdges>) => void)
  nodes?:
    & {
      [Id in ExistingNodes]?: NodeUpdater | undefined | null
    }
    & {
      // dprint-ignore
      [Id: string]: NodeUpdater | undefined | null
    }
}

export type NodeIds = LiteralUnion<ExistingNodes, string>

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
 * It takes snapshot from `index-snapshot.json` as base, applies provided patches
 * to return as auto-layouted.
 *
 * Patcher can modify view properties, and nodes (by id).
 *
 * Nodes can be modified, removed (by setting to null/undefined), or added (by using new id).
 *
 * @example
 * const { snapshot, layouted } = generateView({
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
 *    },
 * })
 */
export function generateView<A extends Patches>(patcher?: A) {
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
      filter(n => !(n.id in patchNodes) || isTruthy(patchNodes[n.id])),
      map(n => {
        const nodePatcher = patchNodes[n.id]
        if (nodePatcher) {
          delete patchNodes[n.id]
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
        }
        layouted.nodes.push(patch(baseNode, patcher))
      }
    }
  }

  return {
    snapshot: snapshot as ViewManualLayoutSnapshot,
    layouted: layouted as LayoutedElementView,
  }
}
