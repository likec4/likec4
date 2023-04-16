/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { ComputedNode, ComputedView, Fqn } from '@likec4/core/types'
import { groupBy, values } from 'rambdax'
import type { GraphBaseModel, NodeModel, SubgraphModel } from 'ts-graphviz'
import { attribute as _, digraph, toDot } from 'ts-graphviz'
import { splitToLines } from '../utils'
import type { DotSource, GvNodeName } from './graphviz-types'
import { estimateNodeSize, pxToInch } from './graphviz-utils'
import { sizes } from './sizes'
import invariant from 'tiny-invariant'

const capitalizeFirstLetter = (value: string) =>
  value.charAt(0).toLocaleUpperCase() + value.slice(1)

const normalizeName = (nodeId: string): string =>
  nodeId.split('.').map(capitalizeFirstLetter).join('')

const gvName = (node: ComputedNode) =>
  ((node.children.length > 0 ? 'cluster_' : 'nd_') + node.id) as GvNodeName

export function printToDot({ autoLayout, nodes, edges }: ComputedView): DotSource {
  const gvSubgraphs = new Map<Fqn, SubgraphModel>()
  const gvNodes = new Map<Fqn, NodeModel>()

  const processNode = (node: ComputedNode, parent: GraphBaseModel) => {
    const name = gvName(node)
    if (node.children.length > 0) {
      const subgraph = parent.createSubgraph(name, {
        [_.id]: node.id,
        [_.labeljust]: 'l',
        [_.label]: node.title,
        [_.margin]: node.children.length > 2 ? 30 : 20
      })
      gvSubgraphs.set(node.id, subgraph)
      // // @ts-expect-error ts-graphviz does not support this attribute
      // subgraph.set('cluster', true)
      for (const childId of node.children) {
        const child = nodes.find(n => n.id === childId)
        invariant(child, `Child node ${childId} if ${node.id} not found`)
        processNode(child, subgraph)
      }
      if (subgraph.nodes.length > 1) {
        const group = normalizeName(node.id)
        subgraph.nodes.forEach(n => {
          n.attributes.set(_.group, group)
        })
      }
    } else {
      const {
        width,
        height
        // title: { fontSize: titleFontSize },
      } = estimateNodeSize(node)
      // const label = [`<FONT POINT-SIZE="15">${splitToLines(node.title, 30).join('<BR/>')}</FONT>`]
      // if( node.description) {
      //   label.push(`<FONT POINT-SIZE="12">${splitToLines(node.description, 30).join('<BR/>')}</FONT>`)
      // }

      const gNode = parent.createNode(name, {
        [_.id]: node.id,
        [_.width]: pxToInch(width),
        [_.height]: pxToInch(height),
        [_.fixedsize]: true,
        [_.label]: node.title.substring(0, 20)
      })
      gvNodes.set(node.id, gNode)
    }
  }

  const G = digraph('G', {
    [_.layout]: 'dot',
    [_.compound]: true,
    [_.rankdir]: autoLayout,
    [_.nodesep]: pxToInch(80),
    [_.ranksep]: pxToInch(70),
    [_.outputorder]: 'nodesfirst',
    // [_.pad]: 0.1,
    [_.fontname]: 'Helvetica',
    [_.fontsize]: 12
  })
  // @ts-expect-error ts-graphviz does not support this attribute
  G.set('TBbalance', 'min')

  // G.attributes.graph.apply({
  // })
  G.attributes.node.apply({
    [_.fontname]: 'Helvetica',
    [_.fontsize]: sizes.title.fontSize,
    [_.shape]: 'rectangle'
    // [_.width]: pxToInch(sizes.width),
    // [_.height]: pxToInch(sizes.height)
  })
  G.attributes.edge.apply({
    [_.fontname]: 'Helvetica',
    [_.fontsize]: 12,
    // [_.penwidth]: 2,
    [_.arrowsize]: 0.7
    // [_.labeldistance]: 10,
    // [_.labelfloat]: true,
    // [_.nojustify]: true,
    // [_.headclip]: false,
    // [_.tailclip]: false,
    // [_.arrowhead]: 'normal',
  })

  for (const root of nodes.filter(n => n.parent === null)) {
    processNode(root, G)
  }

  for (const edgesPerContainer of values(groupBy(e => e.parent ?? '', edges))) {
    for (const edge of edgesPerContainer) {
      const source = gvNodes.get(edge.source)
      const target = gvNodes.get(edge.target)
      if (source && target) {
        const container = (edge.parent && gvSubgraphs.get(edge.parent)) ?? G
        const e = container.edge([source, target], {
          [_.id]: edge.id
        })
        // this is the only edge in the container
        // and the container has no subgraphs
        // so we can remove the constraint
        if (edgesPerContainer.length === 1 && container.subgraphs.length === 0) {
          e.attributes.set(_.constraint, false)
        }
        if (edge.label) {
          const labels = splitToLines(edge.label, 30)
          if (labels.length > 0) {
            let label = labels.join('\\' + 'l')
            if (labels.length > 1) {
              label += '\\' + 'l'
              e.attributes.set(_.nojustify, true)
            }
            e.attributes.set(_.label, label)
          }
        }
      }
    }
  }

  return toDot(G) as DotSource
}
