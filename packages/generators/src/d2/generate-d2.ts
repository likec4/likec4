import type { ComputedEdge, ComputedNode, ComputedView, NodeId } from '@likec4/core'
import { CompositeGeneratorNode, joinToNode, NL, toString } from 'langium/generate'
import { isNullish as isNil } from 'remeda'

const capitalizeFirstLetter = (value: string) => value.charAt(0).toLocaleUpperCase() + value.slice(1)

const fqnName = (nodeId: string): string => nodeId.split('.').map(capitalizeFirstLetter).join('')

const nodeName = (node: ComputedNode): string => {
  return fqnName(node.parent ? node.id.slice(node.parent.length + 1) : node.id)
}

const d2direction = ({ autoLayout }: ComputedView) => {
  switch (autoLayout) {
    case 'TB': {
      return 'down'
    }
    case 'BT': {
      return 'up'
    }
    case 'LR': {
      return 'right'
    }
    case 'RL': {
      return 'left'
    }
  }
}

const d2shape = ({ shape }: ComputedNode) => {
  switch (shape) {
    case 'queue':
    case 'cylinder':
    case 'rectangle':
    case 'person': {
      return shape
    }
    case 'storage': {
      return 'stored_data' as const
    }
    case 'mobile':
    case 'browser': {
      return 'rectangle' as const
    }
  }
}

export function generateD2<V extends ComputedView>(view: V) {
  const { nodes, edges } = view
  const names = new Map<NodeId, string>()

  const printNode = (node: ComputedNode, parentName?: string): CompositeGeneratorNode => {
    const name = nodeName(node)
    const fqnName = (parentName ? parentName + '.' : '') + name
    names.set(node.id, fqnName)

    const label = JSON.stringify(node.title)
    const shape = d2shape(node)

    return new CompositeGeneratorNode()
      .append(name, ': {', NL)
      .indent({
        indentedChildren: indent =>
          indent
            .append('label: ', label, NL)
            .appendIf(shape !== 'rectangle', 'shape: ', shape, NL)
            .appendIf(
              node.children.length > 0,
              NL,
              joinToNode(
                nodes.filter(n => n.parent === node.id),
                n => printNode(n, fqnName)
              )
            ),
        indentation: 2
      })
      .append('}', NL)
  }
  //     return `${names.get(edge.source)} -> ${names.get(edge.target)}${edge.label ? ': ' + edge.label : ''}`
  const printEdge = (edge: ComputedEdge): CompositeGeneratorNode => {
    return new CompositeGeneratorNode()
      .append(names.get(edge.source), ' -> ', names.get(edge.target))
      .append(out => edge.label && out.append(': ', JSON.stringify(edge.label)))
  }

  return toString(
    new CompositeGeneratorNode()
      .append('direction: ', d2direction(view), NL, NL)
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
        NL,
        joinToNode(edges, e => printEdge(e), {
          appendNewLineIfNotEmpty: true
        })
      )
  )
}
