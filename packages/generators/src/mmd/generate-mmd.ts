import { nonexhaustive } from '@likec4/core'
import type { LikeC4ViewModel } from '@likec4/core/model'
import type { aux, NodeId, ProcessedView as AnyView } from '@likec4/core/types'
import { CompositeGeneratorNode, joinToNode, NL, toString } from 'langium/generate'
import { isNullish as isNil } from 'remeda'

const capitalizeFirstLetter = (value: string) => value.charAt(0).toLocaleUpperCase() + value.slice(1)

const fqnName = (nodeId: string): string => nodeId.split('.').map(capitalizeFirstLetter).join('')

type Node = AnyView['nodes'][number]
type Edge = AnyView['edges'][number]

const nodeName = (node: Node): string => {
  return fqnName(node.parent ? node.id.slice(node.parent.length + 1) : node.id)
}

const toSingleQuotes = (str: string): string => str.replace(/\\?"/g, `'`)

const mmdshape = ({ shape, title }: Node): string => {
  const label = `label: ${JSON.stringify(title)}`
  switch (shape) {
    case 'queue': {
      return `@{ shape: horizontal-cylinder, ${label} }`
    }
    case 'person': {
      return `@{ icon: "fa:user", shape: rounded, ${label} }`
    }
    case 'storage': {
      return `@{ shape: disk, ${label} }`
    }
    case 'cylinder': {
      return `@{ shape: cylinder, ${label} }`
    }
    case 'mobile':
    case 'browser': {
      return `@{ shape: rounded, ${label} }`
    }
    case 'bucket': {
      return `@{ shape: trap-t, ${label} }`
    }
    case 'rectangle': {
      return `@{ shape: rectangle, ${label} }`
    }
    case 'document': {
      return `@{ shape: doc, ${label} }`
    }
    case 'component': {
      return `@{ shape: rectangle, ${label} }`
    }
    default:
      nonexhaustive(shape)
  }
}

export function generateMermaid(viewmodel: LikeC4ViewModel<aux.Unknown>) {
  const view = viewmodel.$view
  const { nodes, edges } = view
  const names = new Map<NodeId, string>()

  const printNode = (node: Node, parentName?: string): CompositeGeneratorNode => {
    const name = nodeName(node)
    const fqnName = (parentName ? parentName + '.' : '') + name
    names.set(node.id, fqnName)

    const baseNode = new CompositeGeneratorNode()
    if (node.children.length > 0) {
      const label = toSingleQuotes(node.title)
      baseNode
        .append('subgraph ', fqnName, '["`', label, '`"]', NL)
        .indent({
          indentedChildren: [
            joinToNode(
              nodes.filter(n => n.parent === node.id),
              n => printNode(n, fqnName),
              {
                appendNewLineIfNotEmpty: true,
              },
            ),
          ],
          indentation: 2,
        })
        .append('end', NL)
    } else {
      baseNode.append(fqnName, mmdshape(node))
    }
    return baseNode
  }
  //     return `${names.get(edge.source)} -> ${names.get(edge.target)}${edge.label ? ': ' + edge.label : ''}`
  const printEdge = (edge: Edge): CompositeGeneratorNode => {
    return new CompositeGeneratorNode().append(
      names.get(edge.source),
      ' -.',
      edge.label ? ' "`' + toSingleQuotes(edge.label) + '`" .-' : '-',
      '> ',
      names.get(edge.target),
    )
  }

  return toString(
    new CompositeGeneratorNode()
      .append(
        '---',
        NL,
        `title: ${JSON.stringify(toSingleQuotes(viewmodel.titleOrId))}`,
        NL,
        '---',
        NL,
      )
      .append('graph ', view.autoLayout.direction, NL)
      .indent({
        indentedChildren: indent => {
          indent
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
              joinToNode(edges, e => printEdge(e), {
                appendNewLineIfNotEmpty: true,
              }),
            )
        },
        indentation: 2,
      }),
  )
}
