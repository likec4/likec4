import {
  DefaultRelationshipColor,
  defaultTheme as Theme,
  DefaultThemeColor,
  invariant,
  nameFromFqn,
  nonNullable,
  parentFqn
} from '@likec4/core'
import type {
  ComputedEdge,
  ComputedNode,
  ComputedView,
  DiagramView,
  Fqn,
  RelationshipLineType,
  ViewManualLayout
} from '@likec4/core/types'
import { entries, first, isNullish, isNumber, isTruthy, values } from 'remeda'
import {
  attribute as _,
  type AttributeListModel,
  digraph,
  type EdgeAttributeKey,
  type EdgeModel,
  type GraphBaseModel,
  type NodeAttributeKey,
  type NodeModel,
  type RootGraphModel,
  type SubgraphModel,
  toDot as modelToDot
} from 'ts-graphviz'
import { nodeLabel, sanitize } from './dot-labels'
import type { DotSource } from './types'
import { compoundColor, compoundLabelColor, isCompound, pxToInch, pxToPoints } from './utils'

export const DefaultEdgeStyle = 'dashed' satisfies RelationshipLineType

export abstract class DotPrinter<V extends ComputedView = ComputedView> {
  private ids = new Set<string>()
  private subgraphs = new Map<Fqn, SubgraphModel>()
  private nodes = new Map<Fqn, NodeModel>()

  public readonly graphvizModel: RootGraphModel

  constructor(protected view: V) {
    const G = this.graphvizModel = this.createGraph()
    this.applyNodeAttributes(G.attributes.node)
    this.applyEdgeAttributes(G.attributes.edge)
    this.buildGraphvizModel(G)
  }
  protected buildGraphvizModel(G: RootGraphModel): void {
    // ----------------------------------------------
    // Traverse clusters first
    const traverseClusters = (element: ComputedNode, parent: GraphBaseModel) => {
      const id = this.nodeId(element)
      const subgraph = this.elementToSubgraph(element, parent.subgraph(id))
      this.subgraphs.set(element.id, subgraph)
      // Traverse nested clusters
      for (const child of this.view.nodes.filter(n => isCompound(n) && n.parent === element.id)) {
        traverseClusters(child, subgraph)
      }
    }

    const leafElements = [] as ComputedNode[]
    for (const element of this.view.nodes) {
      if (isCompound(element)) {
        if (isNullish(element.parent)) {
          traverseClusters(element, G)
        }
      } else {
        leafElements.push(element)
      }
    }
    for (const element of leafElements) {
      const graph = element.parent ? this.getSubgraph(element.parent) : G
      invariant(graph, 'parent graph should be defined')
      const id = this.nodeId(element)
      const node = this.elementToNode(element, graph.node(id))
      this.nodes.set(element.id, node)
    }

    for (const edge of this.view.edges) {
      this.addEdge(edge, G)
    }
  }

  public print(): DotSource {
    return modelToDot(this.graphvizModel, {
      print: {
        indentStyle: 'space',
        indentSize: 2
      }
    }) as DotSource
  }

  /**
   * Use coordinates from given diagram as initial position for nodes
   * (try to keep existing layout as much as possible)
   */
  public applyManualLayout({ nodes, edges }: ViewManualLayout): this {
    const height = Math.max(
      ...values(nodes).map(({ y, height }) => y + height),
      ...values(edges).flatMap(({ controlPoints }) => controlPoints.map(p => p.y))
    )
    let inherited = false
    for (const [id, pos] of entries(nodes)) {
      const model = this.getGraphNode(id as Fqn)
      if (model) {
        // Invert Y axis and convert to inches
        const x = pxToInch(pos.x + pos.width / 2)
        const y = pxToInch(height - (pos.y + pos.height / 2))
        model.attributes.apply({
          [_.pos]: `${x},${y}!`,
          [_.width]: pxToInch(pos.width),
          [_.height]: pxToInch(pos.height)
        })
        inherited = true
      }
    }
    if (inherited) {
      this.graphvizModel.apply({
        [_.layout]: 'fdp',
        [_.scale]: 72.0,
        [_.overlap]: 'vpsc',
        [_.sep]: '+50,50',
        [_.esep]: '+10,10',
        [_.splines]: 'curved'
      })
      this.graphvizModel.delete(_.compound)
      this.graphvizModel.delete(_.rankdir)
      this.graphvizModel.delete(_.nodesep)
      this.graphvizModel.delete(_.ranksep)
    }
    return this
  }

  protected createGraph(): RootGraphModel {
    const G = digraph({
      [_.bgcolor]: 'transparent',
      [_.layout]: 'dot',
      [_.compound]: true,
      [_.rankdir]: this.view.autoLayout,
      [_.TBbalance]: 'min',
      [_.splines]: 'spline',
      [_.outputorder]: 'nodesfirst',
      [_.nodesep]: pxToInch(100),
      [_.ranksep]: pxToInch(110),
      [_.pack]: pxToPoints(180),
      [_.packmode]: 'array_3',
      [_.pad]: pxToInch(10)
    })
    G.attributes.graph.apply({
      [_.fontname]: Theme.font,
      [_.fontsize]: pxToPoints(13),
      [_.labeljust]: this.view.autoLayout === 'RL' ? 'r' : 'l',
      [_.labelloc]: this.view.autoLayout === 'BT' ? 'b' : 't',
      [_.penwidth]: pxToPoints(1)
    })

    return G
  }

  protected applyNodeAttributes(node: AttributeListModel<'Node', NodeAttributeKey>) {
    node.apply({
      [_.fontname]: Theme.font,
      [_.fontsize]: pxToPoints(20),
      [_.fontcolor]: Theme.elements[DefaultThemeColor].hiContrast,
      [_.shape]: 'rect',
      [_.width]: pxToInch(320),
      [_.height]: pxToInch(180),
      [_.style]: 'filled,rounded',
      [_.fillcolor]: Theme.elements[DefaultThemeColor].fill,
      [_.color]: Theme.elements[DefaultThemeColor].stroke,
      [_.penwidth]: 0,
      [_.margin]: pxToInch(26)
    })
  }
  protected applyEdgeAttributes(edge: AttributeListModel<'Edge', EdgeAttributeKey>) {
    edge.apply({
      [_.fontname]: Theme.font,
      [_.fontsize]: pxToPoints(13),
      [_.penwidth]: pxToPoints(2),
      [_.style]: DefaultEdgeStyle,
      [_.color]: Theme.relationships[DefaultRelationshipColor].lineColor,
      [_.fontcolor]: Theme.relationships[DefaultRelationshipColor].labelColor
    })
  }

  protected checkNodeId(name: string, isCompound = false) {
    if (isCompound) {
      name = 'cluster_' + name
    } else if (name.toLowerCase().startsWith('cluster')) {
      name = 'nd_' + name
    }
    if (!this.ids.has(name)) {
      this.ids.add(name)
      return name
    }
    return null
  }

  protected nodeId(node: ComputedNode) {
    const _compound = isCompound(node)
    let elementName = nameFromFqn(node.id).toLowerCase()
    let name = this.checkNodeId(elementName, _compound)
    if (name !== null) {
      return name
    }
    // try to use parent name
    let fqn = node.id
    let parentId
    while ((parentId = parentFqn(fqn))) {
      elementName = nameFromFqn(parentId).toLowerCase() + '_' + elementName
      name = this.checkNodeId(elementName, _compound)
      if (name !== null) {
        return name
      }
      fqn = parentId
    }
    // use post-index
    elementName = nameFromFqn(node.id).toLowerCase()
    let i = 1
    do {
      name = this.checkNodeId(elementName + '_' + i++, _compound)
    } while (name === null)
    return name
  }

  protected elementToSubgraph(compound: ComputedNode, subgraph: SubgraphModel) {
    invariant(isCompound(compound), 'node should be compound')
    invariant(isNumber(compound.depth), 'node.depth should be defined')
    subgraph.apply({
      [_.likec4_id]: compound.id,
      [_.likec4_level]: compound.level,
      [_.likec4_depth]: compound.depth,
      [_.fillcolor]: compoundColor(Theme.elements[compound.color].fill, compound.depth),
      [_.color]: compoundColor(Theme.elements[compound.color].stroke, compound.depth),
      [_.style]: 'filled',
      [_.margin]: pxToPoints(40)
    })
    const label = sanitize(compound.title.toUpperCase())
    if (isTruthy(label)) {
      const color = compoundLabelColor(Theme.elements[compound.color].loContrast)
      subgraph.apply({
        [_.fontcolor]: color,
        [_.label]: `<<B>${label}</B>>`
      })
    }
    return subgraph
  }

  protected elementToNode(element: ComputedNode, node: NodeModel) {
    invariant(!isCompound(element), 'node should not be compound')
    node.attributes.apply({
      [_.likec4_id]: element.id,
      [_.likec4_level]: element.level,
      [_.margin]: pxToInch(30)
    })
    if (element.color !== DefaultThemeColor) {
      node.attributes.apply({
        [_.fillcolor]: Theme.elements[element.color].fill
      })
    }
    switch (element.shape) {
      case 'browser': {
        node.attributes.apply({
          [_.margin]: `${pxToInch(30)},${pxToInch(32)}`
        })
        break
      }
      case 'queue': {
        node.attributes.apply({
          [_.width]: pxToInch(320),
          [_.height]: pxToInch(165),
          [_.margin]: `${pxToInch(30)},${pxToInch(26)}`
        })
        break
      }
      case 'cylinder':
      case 'storage': {
        node.attributes.apply({
          [_.margin]: `${pxToInch(26)},${pxToInch(30)}`,
          [_.color]: Theme.elements[element.color].stroke,
          [_.penwidth]: pxToPoints(2),
          [_.shape]: 'cylinder'
        })
        break
      }
      default:
        break
    }
    // add label to the end
    node.attributes.set(_.label, nodeLabel(element))
    return node
  }

  /**
   * ElementView and DynamicView have different implementation
   */
  protected abstract addEdge(edge: ComputedEdge, G: RootGraphModel): EdgeModel | null

  protected leafElements(parentId: Fqn | null): ComputedNode[] {
    if (parentId === null) {
      return this.view.nodes.filter(n => !isCompound(n))
    }
    const prefix = parentId + '.'
    return this.view.nodes.filter(
      n => !isCompound(n) && (n.parent === parentId || n.parent?.startsWith(prefix))
    )
  }

  protected viewElement(id: Fqn) {
    return nonNullable(
      this.view.nodes.find(n => n.id === id),
      `Node ${id} not found`
    )
  }

  protected getGraphNode(id: Fqn) {
    return this.nodes.get(id) ?? null
  }

  protected getSubgraph(id: Fqn) {
    return this.subgraphs.get(id) ?? null
  }

  /**
   * In case edge with cluster as endpoint, picks nested node to use as endpoint
   */
  protected edgeEndpoint(
    sourceId: Fqn,
    pickFromCluster: (data: ComputedNode[]) => ComputedNode | undefined = first
  ) {
    let element = this.viewElement(sourceId)
    let endpoint = this.getGraphNode(sourceId)
    let ltail: string | undefined
    if (!endpoint) {
      invariant(isCompound(element), 'endpoint node should be compound')
      // Edge with cluster as endpoint
      ltail = this.getSubgraph(sourceId)?.id
      invariant(ltail, `subgraph ${sourceId} not found`)
      element = nonNullable(
        pickFromCluster(this.leafElements(sourceId)),
        `leaf element in ${sourceId} not found`
      )
      endpoint = nonNullable(
        this.getGraphNode(element.id),
        `source graphviz node ${element.id} not found`
      )
    }
    return [element, endpoint, ltail] as const
  }

  protected findNestedEdges(parentId: Fqn | null): ComputedEdge[] {
    if (parentId === null) {
      return this.view.edges.slice()
    }
    const prefix = parentId + '.'
    return this.view.edges.filter(
      e => e.parent && (e.parent === parentId || e.parent.startsWith(prefix))
    )
  }
}
