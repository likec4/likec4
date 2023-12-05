import type { ComputedEdge, ComputedNode, ComputedView, NodeId } from '@likec4/core'
import { CompositeGeneratorNode, NL, NLEmpty, expandToNode, joinToNode, toString } from 'langium'
import { isNil } from 'rambdax'

const capitalizeFirstLetter = (value: string) =>
  value.charAt(0).toLocaleUpperCase() + value.slice(1)

const fqnName = (nodeId: string): string => nodeId.split('.').map(capitalizeFirstLetter).join('')

const nodeName = (node: ComputedNode): string => {
  return fqnName(node.parent ? node.id.slice(node.parent.length + 1) : node.id)
}

const mmdshape = ({ shape }: ComputedNode): [start: string, end: string] => {
  switch (shape) {
    case 'queue':
    case 'cylinder':
      return ['[(', ')]']
    case 'person': {
      return ['[fa:fa-user ', ']']
    }
    case 'storage':
      return ['([', '])']
    case 'mobile':
    case 'browser':
    case 'rectangle': {
      return ['[', ']']
    }
  }
}

export function generateMermaid<V extends ComputedView>(view: V) {
  const { nodes, edges } = view
  const names = new Map<NodeId, string>()

  const printNode = (node: ComputedNode, parentName?: string): CompositeGeneratorNode => {
    const name = nodeName(node)
    const fqnName = (parentName ? parentName + '.' : '') + name
    names.set(node.id, fqnName)

    const label = node.title.replaceAll('\n', '\\n')
    const shape = mmdshape(node)

    const baseNode = new CompositeGeneratorNode()
    if (node.children.length > 0) {
      baseNode
        .append('subgraph ', fqnName, '["', label, '"]', NL)
        .indent({
          indentedChildren: [
            joinToNode(
              nodes.filter(n => n.parent === node.id),
              n => printNode(n, fqnName),
              {
                appendNewLineIfNotEmpty: true
              }
            )
          ],
          indentation: 2
        })
        .append('end', NL)
    } else {
      baseNode.append(fqnName, shape[0], label, shape[1])
    }
    return baseNode
  }
  //     return `${names.get(edge.source)} -> ${names.get(edge.target)}${edge.label ? ': ' + edge.label : ''}`
  const printEdge = (edge: ComputedEdge): CompositeGeneratorNode => {
    return new CompositeGeneratorNode().append(
      names.get(edge.source),
      ' --',
      edge.label ? '"' + edge.label.replaceAll('\n', '\\n') + '"--' : '',
      '> ',
      names.get(edge.target)
    )
  }

  return toString(
    new CompositeGeneratorNode()
      .appendIf(
        view.title !== null && view.title.length > 0,
        '---',
        NL,
        `title: ${JSON.stringify(view.title)}`,
        NL,
        '---',
        NL
      )
      .append('graph ', view.autoLayout, NL)
      .indent({
        indentedChildren: indent => {
          indent
            .append(
              joinToNode(
                nodes.filter(n => isNil(n.parent)),
                n => printNode(n),
                {
                  appendNewLineIfNotEmpty: true
                }
              )
            )
            .appendIf(
              edges.length > 0,
              joinToNode(edges, e => printEdge(e), {
                appendNewLineIfNotEmpty: true
              })
            )
        },
        indentation: 2
      })
  )
}
