import type { LikeC4ViewModel } from '@likec4/core/model'
import type {
  aux,
  Color,
  ComputedEdge,
  ComputedNode,
  ElementColorValues,
  KeysOf,
  NodeId,
  ProcessedView,
  RelationshipColorValues,
  ThemeColor,
} from '@likec4/core/types'
import { RichText } from '@likec4/core/types'
import { CompositeGeneratorNode, joinToNode, NL, toString } from 'langium/generate'
import { isNullish as isNil } from 'remeda'

const capitalizeFirstLetter = (value: string) => value.charAt(0).toLocaleUpperCase() + value.slice(1)

const fqnName = (nodeId: string): string => {
  // Split on both '.' and '-' to handle dashed identifiers (e.g., payment-gateway -> PaymentGateway)
  return nodeId.split(/[.-]/).map(capitalizeFirstLetter).join('')
}

const nodeName = (node: ComputedNode): string => {
  return fqnName(node.parent ? node.id.slice(node.parent.length + 1) : node.id)
}

const pumlColor = (
  color: Color | undefined,
  customColorProvider: (colorKey: Color) => string | undefined,
  defaultColor: string = '#3b82f6',
) => {
  if (color) {
    return customColorProvider(color) ?? defaultColor
  }
  return defaultColor
}

const pumlDirection = ({ autoLayout }: ProcessedView) => {
  switch (autoLayout.direction) {
    case 'TB': {
      return 'top to bottom'
    }
    case 'BT': {
      console.warn('Bottom to top direction is not supported. Defaulting to top to bottom.')
      return 'top to bottom'
    }
    case 'LR': {
      return 'left to right'
    }
    case 'RL': {
      console.warn('Right to left direction is not supported. Defaulting to left to right.')
      return 'left to right'
    }
  }
}

const pumlShape = ({ shape }: ComputedNode) => {
  switch (shape) {
    case 'queue':
    case 'rectangle':
    case 'document':
    case 'person': {
      return shape
    }
    case 'storage':
    case 'cylinder': {
      return 'database' as const
    }
    case 'mobile':
    case 'bucket':
    case 'browser': {
      return 'rectangle' as const
    }
  }
}

const escapeLabel = (label: string | null | undefined) => isNil(label) ? null : JSON.stringify(label).slice(1, -1)

export function generatePuml(viewmodel: LikeC4ViewModel<aux.Unknown>) {
  const view = viewmodel.$view
  const colors = viewmodel.$model.$styles.theme.colors
  const { nodes, edges } = view

  const elemntColorProvider = (key: KeysOf<ElementColorValues>) => (colorKey: Color) =>
    colorKey in colors ? colors[colorKey as ThemeColor].elements[key] : undefined
  const relationshipsColorProvider = (key: KeysOf<RelationshipColorValues>) => (colorKey: Color) =>
    colorKey in colors ? colors[colorKey as ThemeColor].relationships[key] : undefined

  const names = new Map<NodeId, string>()

  const printHeader = () => {
    return new CompositeGeneratorNode()
      .append('title "', view.title || view.id, '"', NL)
      .append(pumlDirection(view), ' direction', NL)
  }

  const printTheme = () => {
    return new CompositeGeneratorNode()
      .append('hide stereotype', NL)
      .append('skinparam ranksep ', '60', NL)
      .append('skinparam nodesep ', '30', NL)
      .append('skinparam {', NL)
      .indent({
        indentedChildren: indent =>
          indent
            .append('arrowFontSize ', '10', NL)
            .append('defaultTextAlignment ', 'center', NL)
            .append('wrapWidth ', '200', NL)
            .append('maxMessageSize ', '100', NL)
            .append('shadowing ', 'false', NL),
        indentation: 2,
      })
      .append('}', NL)
  }

  const printStereotypes = (node: ComputedNode): CompositeGeneratorNode => {
    const shape = pumlShape(node)
    const fqn = fqnName(node.id)

    return new CompositeGeneratorNode()
      .append('skinparam ', shape, '<<', fqn, '>>', '{', NL)
      .indent({
        indentedChildren: indent =>
          indent
            .append('BackgroundColor ', pumlColor(node.color, elemntColorProvider('fill')), NL)
            .append(
              'FontColor ',
              pumlColor(node.color, elemntColorProvider('hiContrast'), '#FFFFFF'),
              NL,
            )
            .append('BorderColor ', pumlColor(node.color, elemntColorProvider('stroke')), NL),
        indentation: 2,
      })
      .append('}', NL)
  }

  const printNode = (node: ComputedNode): CompositeGeneratorNode => {
    const shape = pumlShape(node)
    const fqn = fqnName(node.id)
    const label = escapeLabel(node.title) || nodeName(node)
    const tech = escapeLabel(node.technology)
    names.set(node.id, fqn)

    const description = RichText.from(node.description)

    return new CompositeGeneratorNode()
      .append(shape, ' ')
      .append('"')
      .append('==', label)
      .appendIf(!!tech, '\\n', '<size:10>[', tech!, ']</size>')
      .appendIf(description.nonEmpty, '\\n\\n', escapeLabel(description.text)!)
      .append('"', ' <<', fqn, '>> ', 'as ', fqn, NL)
  }

  const printBoundary = (node: ComputedNode): CompositeGeneratorNode => {
    const label = escapeLabel(node.title) || nodeName(node)
    const fqn = fqnName(node.id)
    names.set(node.id, fqn)

    return new CompositeGeneratorNode()
      .append('rectangle "', label, '" <<', fqn, '>> as ', fqn, ' {', NL)
      .indent({
        indentedChildren: indent =>
          indent
            .append(
              'skinparam ',
              'RectangleBorderColor<<',
              fqn,
              '>> ',
              pumlColor(node.color, elemntColorProvider('fill')),
              NL,
            )
            .append(
              'skinparam ',
              'RectangleFontColor<<',
              fqn,
              '>> ',
              pumlColor(node.color, elemntColorProvider('fill')),
              NL,
            )
            .append('skinparam ', 'RectangleBorderStyle<<', fqn, '>> ', 'dashed', NL, NL)
            .append(joinToNode(
              nodes.filter(n => n.parent === node.id),
              c => c.children.length > 0 ? printBoundary(c) : printNode(c),
            )),
        indentation: 2,
      })
      .append('}', NL)
  }

  const printEdge = (edge: ComputedEdge): CompositeGeneratorNode => {
    const tech = escapeLabel(edge.technology) || ''
    const label = escapeLabel(edge.label) || ''
    const color = pumlColor(edge.color, relationshipsColorProvider('line'), '#777777')

    const colorTag = (color: string) => `<color:${color}>`

    return new CompositeGeneratorNode()
      .append(names.get(edge.source), ' .[', color, ',thickness=2].> ', names.get(edge.target))
      .appendIf(!!(label || tech), ' : "', colorTag(color))
      .appendIf(!!label, label, colorTag(color))
      .appendIf(!!(label && tech), '\\n')
      .appendIf(!!tech, colorTag(color), '<size:8>[', tech, ']</size>')
      .appendIf(!!(label || tech), '"')
      .append(NL)
  }

  return toString(
    new CompositeGeneratorNode()
      .append('@startuml', NL)
      .append(printHeader(), NL)
      .append(printTheme(), NL)
      .append(
        joinToNode(
          nodes.filter(n => n.children.length == 0),
          n => printStereotypes(n),
          {
            appendNewLineIfNotEmpty: true,
          },
        ),
      )
      .append(
        joinToNode(
          nodes.filter(n => isNil(n.parent)),
          n => n.children.length > 0 ? printBoundary(n) : printNode(n),
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
      )
      .append(`@enduml`, NL),
  )
}
