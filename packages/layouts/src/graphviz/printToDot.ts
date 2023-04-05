/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { ComputedEdge, ComputedNode, ComputedView, Fqn } from '@likec4/core/types'
import graphlib from 'graphlib'
import type { GraphBaseModel, NodeModel, SubgraphModel } from 'ts-graphviz'
import { attribute as _, digraph, toDot } from 'ts-graphviz'
import { splitToLines } from '../utils'
import type { DotSource, GvNodeName } from './graphviz-types'
import { estimateNodeSize, pxToInch } from './graphviz-utils'
import { sizes } from './sizes'
import { groupBy, partition, values } from 'rambdax'

const gvName = (node: ComputedNode) => (node.children.length > 0 ? 'cluster_' : 'node_') + node.id as GvNodeName

export function printToDot({ nodes, edges }: ComputedView): DotSource {
  const gvSubgraphs = new Map<Fqn, SubgraphModel>()
  const gvNodes = new Map<Fqn, NodeModel>()
  const processNode = (node: ComputedNode, parent: GraphBaseModel) => {
    const name = gvName(node)
    const children = nodes.filter(n => n.parent === node.id)
    if (children.length > 0) {
      const subgraph = parent.subgraph(name, {
        [_.id]: node.id,
        [_.labeljust]: 'l',
        [_.label]: node.title,
        [_.margin]: node.children.length > 2 ? 30 : 20,
      })
      for (const child of children) {
        processNode(child, subgraph)
      }
      if (subgraph.subgraphs.length === 0) {
        subgraph.set(_.rank, 'same')
      }
      gvSubgraphs.set(node.id, subgraph)
    } else {
      const {
        width,
        height,
        // title: { fontSize: titleFontSize },
      } = estimateNodeSize(node)
      // const label = [`<FONT POINT-SIZE="15">${splitToLines(node.title, 30).join('<BR/>')}</FONT>`]
      // if( node.description) {
      //   label.push(`<FONT POINT-SIZE="12">${splitToLines(node.description, 30).join('<BR/>')}</FONT>`)
      // }
      const gNode = parent.node(name, {
        [_.id]: node.id,
        // [_.fontsize]: titleFontSize,
        [_.width]: pxToInch(width),
        [_.height]: pxToInch(height),
        // [_.margin]: pxToInch(padding),
        [_.fixedsize]: true,
        [_.label]: '',
        // [_.label]: `<${label.join('<BR/>')}>`,
      })
      gvNodes.set(node.id, gNode)
    }
  }

  // const processEdge = (edge: ComputedEdge, parent: GraphBaseModel) => {
  //   const source = gvNodes.get(edge.source)
  //   const target = gvNodes.get(edge.target)
  //   if (source && target) {
  //     g.setEdge({
  //       v: edge.source,
  //       w: edge.target,
  //       name: edge.id,
  //     })
  //     const e = parent.edge([source, target], {
  //       [_.id]: edge.id,
  //     })
  //     if (edge.label) {
  //       const labels = splitToLines(edge.label, 30)
  //       if (labels.length > 0) {
  //         e.attributes.set(_.label, `<${labels.join('<BR/>')}>`)
  //       }
  //     }
  //   }
  // }

  const G = digraph('G', {
    [_.layout]: 'dot',
    [_.compound]: true,
    [_.rankdir]: 'TB',
    [_.nodesep]: pxToInch(80),
    [_.ranksep]: pxToInch(70),
    [_.outputorder]: 'nodesfirst',
    [_.pad]: 0.1,
  })
  // @ts-expect-error ts-graphviz does not support this attribute
  G.set('TBbalance', 'min')

  G.attributes.graph.apply({
    [_.fontname]: 'Helvetica',
    [_.fontsize]: 12
  })
  G.attributes.node.apply({
    [_.fontname]: 'Helvetica',
    [_.fontsize]: sizes.title.fontSize,
    [_.shape]: 'rectangle',
    [_.width]: pxToInch(sizes.width),
    [_.height]: pxToInch(sizes.height)
  })
  G.attributes.edge.apply({
    [_.labelfontname]: 'Helvetica',
    [_.labelfontsize]: 12,
    [_.penwidth]: 2,
    [_.arrowsize]: 0.7,
    // [_.labeldistance]: 10,
    // [_.labelfloat]: true,
    // [_.headclip]: false,
    // [_.tailclip]: false,
    // [_.arrowhead]: 'normal',
  })

  for (const root of nodes.filter(n => n.parent === null)) {
    processNode(root, G)
  }

  // const g = new graphlib.Graph({
  //   directed: true,
  //   multigraph: true,
  // })
  // g.setNodes([...gvNodes.keys()])

  for (const groupedEdges of values(groupBy(e => e.parent ?? '-', edges))) {
    for (const edge of groupedEdges) {
      const source = gvNodes.get(edge.source)
      const target = gvNodes.get(edge.target)
      if (source && target) {
        // g.setEdge({
        //   v: edge.source,
        //   w: edge.target,
        //   name: edge.id,
        // })
        const container = (edge.parent && gvSubgraphs.get(edge.parent)) ?? G
        const e = container.edge([source, target], {
          [_.id]: edge.id,
        })
        if (groupedEdges.length === 1 && container.subgraphs.length === 0) {
          e.attributes.set(_.constraint, false)
        }
        if (edge.label) {
          const labels = splitToLines(edge.label, 30)
          if (labels.length > 0) {
            e.attributes.set(_.label, `<${labels.join('<BR/>')}>`)
          }
        }
      }
    }
  }

  return toDot(G) as DotSource
}
