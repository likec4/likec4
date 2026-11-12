import type { LikeC4ViewModel } from '@likec4/core/model'
import type { aux, ComputedNode, NodeId, ProcessedView as AnyView } from '@likec4/core/types'
import { CompositeGeneratorNode, joinToNode } from 'langium/generate'
import { isNullish as isNil } from 'remeda'
import { NL, toStringLF } from '../newline'

const capitalizeFirstLetter = (value: string) => value.charAt(0).toLocaleUpperCase() + value.slice(1)

const fqnName = (nodeId: string): string => nodeId.split('.').map(capitalizeFirstLetter).join('')

/**
 * A quoted D2 key, so that names like `Label`, `Icon` or `Top` are not read as D2 reserved keywords
 */
const d2key = (name: string): string => JSON.stringify(name)

/**
 * A double-quoted D2 string. D2 substitutes `${...}` in double-quoted strings, so `$` before `{` is escaped.
 */
const d2string = (value: string): string => JSON.stringify(value).replaceAll('${', '\\${')

const nodeName = (node: ComputedNode): string => {
  // The parent may be a group (`@gr1`), whose id is not a prefix of the node id
  const prefix = node.parent ? node.parent + '.' : ''
  return d2key(fqnName(prefix && node.id.startsWith(prefix) ? node.id.slice(prefix.length) : node.id))
}

type Node = AnyView['nodes'][number]
type Edge = AnyView['edges'][number]

const d2direction = ({ autoLayout }: AnyView) => {
  switch (autoLayout.direction) {
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

const d2shape = ({ shape }: Node) => {
  switch (shape) {
    case 'queue':
    case 'cylinder':
    case 'rectangle':
    case 'document': {
      return shape
    }
    case 'person': {
      return 'c4-person' as const
    }
    case 'storage': {
      return 'stored_data' as const
    }
    case 'component':
    case 'bucket':
    case 'agent':
    case 'mobile':
    case 'browser': {
      return 'rectangle' as const
    }
  }
}

export function generateD2(viewmodel: LikeC4ViewModel<aux.Unknown>) {
  const view = viewmodel.$view
  const { nodes, edges } = view
  const names = new Map<NodeId, string>()

  const printNode = (node: Node, parentName?: string): CompositeGeneratorNode => {
    const name = nodeName(node)
    const fqnName = (parentName ? parentName + '.' : '') + name
    names.set(node.id, fqnName)

    const label = d2string(node.title)
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
                n => printNode(n, fqnName),
              ),
            ),
        indentation: 2,
      })
      .append('}', NL)
  }
  //     return `${names.get(edge.source)} -> ${names.get(edge.target)}${edge.label ? ': ' + edge.label : ''}`
  const printEdge = (edge: Edge): CompositeGeneratorNode => {
    return new CompositeGeneratorNode()
      .append(names.get(edge.source), ' -> ', names.get(edge.target))
      .append(out => edge.label && out.append(': ', d2string(edge.label)))
  }

  return toStringLF(
    new CompositeGeneratorNode()
      .append('direction: ', d2direction(view), NL, NL)
      .append(
        joinToNode(
          nodes.filter(n => isNil(n.parent)),
          n => printNode(n),
          {
            appendNewLineIfNotEmpty: true,
          },
        ),
      )
      .appendIf(
        edges.length > 0,
        NL,
        joinToNode(edges, e => printEdge(e), {
          appendNewLineIfNotEmpty: true,
        }),
      ),
  )
}
