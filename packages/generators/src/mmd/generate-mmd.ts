import { nonexhaustive } from '@likec4/core'
import type { LikeC4ViewModel } from '@likec4/core/model'
import type { LikeC4Styles } from '@likec4/core/styles'
import type { aux, Color, NodeId, ProcessedView as AnyView, RelationshipLineType } from '@likec4/core/types'
import { CompositeGeneratorNode, joinToNode } from 'langium/generate'
import { groupBy, isNullish as isNil } from 'remeda'
import { NL, toStringLF } from '../newline'

const capitalizeFirstLetter = (value: string) => value.charAt(0).toLocaleUpperCase() + value.slice(1)

const safeChars = (value: string): string => value.replace(/\W/g, '_')

const fqnName = (nodeId: string): string => nodeId.split('.').map(safeChars).map(capitalizeFirstLetter).join('')

type Node = AnyView['nodes'][number]
type Edge = AnyView['edges'][number]

const nodeName = (node: Node): string => {
  const prefix = node.parent ? node.parent + '.' : ''
  return fqnName(prefix && node.id.startsWith(prefix) ? node.id.slice(prefix.length) : node.id)
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
    case 'agent':
    case 'component': {
      return `@{ shape: rectangle, ${label} }`
    }
    default:
      nonexhaustive(shape)
  }
}

/**
 * Mermaid arrow for a relationship line: solid lines stay solid, dashed and dotted lines are drawn dotted
 * (Mermaid has no dashed arrow, `linkStyle` adds the dash pattern).
 *
 * @example mmdArrow('solid', 'calls') // ' -- "`calls`" --> '
 */
const mmdArrow = (line: RelationshipLineType, label: string | null): string => {
  const text = label ? `"\`${toSingleQuotes(label)}\`"` : null
  switch (true) {
    case line === 'solid': {
      return text ? ` -- ${text} --> ` : ' --> '
    }
    case line === 'dashed':
    case line === 'dotted': {
      return text ? ` -. ${text} .-> ` : ' -.-> '
    }
    default:
      nonexhaustive(line)
  }
}

/**
 * Dash pattern of a relationship line in `linkStyle`, `null` for solid and dotted lines,
 * which the Mermaid arrow already draws.
 */
const mmdDashArray = (line: RelationshipLineType): string | null => (line === 'dashed' ? '8 4' : null)

/**
 * `classDef` and `class` statements that give leaf nodes the fill, border and text colors of their element color.
 */
function printNodeColors(
  styles: LikeC4Styles,
  leaves: ReadonlyArray<{ color: Color; name: string }>,
): CompositeGeneratorNode | undefined {
  const byColor = groupBy(leaves, leaf => leaf.color)
  // Mermaid applies `classDef default` to every node without a class, and colors such as `brand-blue` and
  // `brand_blue` sanitize to one name: a taken name gets a numeric suffix
  const classNames = new Set(['default'])
  const uniqueClassName = (color: string): string => {
    const base = safeChars(color)
    let className = base
    for (let suffix = 2; classNames.has(className); suffix++) {
      className = `${base}_${suffix}`
    }
    classNames.add(className)
    return className
  }
  return joinToNode(
    Object.entries(byColor),
    ([color, colored]) => {
      const { fill, stroke, hiContrast } = styles.colors(color).elements
      const className = uniqueClassName(color)
      return new CompositeGeneratorNode()
        .append('classDef ', className, ' fill:', fill, ',stroke:', stroke, ',color:', hiContrast, NL)
        .append('class ', colored.map(leaf => leaf.name).join(','), ' ', className)
    },
    { appendNewLineIfNotEmpty: true },
  )
}

/**
 * `linkStyle` statements that give edges the line color of their relationship color and their dash pattern,
 * one statement per distinct style, edges addressed by their index in the order they are printed.
 */
function printEdgeStyles(styles: LikeC4Styles, edges: ReadonlyArray<Edge>): CompositeGeneratorNode | undefined {
  const indexesByStyle = new Map<string, number[]>()
  edges.forEach((edge, index) => {
    // Only the line: the label color is meant for LikeC4's dark label background, Mermaid's stays light
    const stroke = styles.colors(edge.color).relationships.line
    const dashArray = mmdDashArray(edge.line)
    const style = `stroke:${stroke}` + (dashArray ? `,stroke-dasharray:${dashArray}` : '')
    const indexes = indexesByStyle.get(style)
    if (indexes) {
      indexes.push(index)
    } else {
      indexesByStyle.set(style, [index])
    }
  })
  return joinToNode(
    [...indexesByStyle],
    ([style, indexes]) => `linkStyle ${indexes.join(',')} ${style}`,
    { appendNewLineIfNotEmpty: true },
  )
}

export function generateMermaid(viewmodel: LikeC4ViewModel<aux.Unknown>) {
  const view = viewmodel.$view
  const styles = viewmodel.$model.$styles
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
  const printEdge = (edge: Edge): CompositeGeneratorNode => {
    return new CompositeGeneratorNode().append(
      names.get(edge.source),
      mmdArrow(edge.line, edge.label),
      names.get(edge.target),
    )
  }

  return toStringLF(
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
            .append(
              printNodeColors(
                styles,
                nodes
                  // The person shape is an icon with the label below it, outside the fill: a light text color would vanish
                  .filter(n => n.children.length === 0 && n.shape !== 'person')
                  .map(n => ({ color: n.color, name: names.get(n.id)! })),
              ),
            )
            .appendIf(edges.length > 0, printEdgeStyles(styles, edges))
        },
        indentation: 2,
      }),
  )
}
