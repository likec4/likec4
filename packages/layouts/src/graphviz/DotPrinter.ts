import {
  compareFqnHierarchically,
  DefaultRelationshipColor,
  defaultTheme as Theme,
  DefaultThemeColor,
  invariant,
  isThemeColor,
  nameFromFqn,
  nonNullable,
  parentFqn,
} from '@likec4/core'
import type {
  Color,
  ComputedEdge,
  ComputedNode,
  ComputedView,
  EdgeId,
  ElementThemeColorValues,
  Fqn,
  RelationshipLineType,
  RelationshipThemeColorValues,
  XYPoint,
} from '@likec4/core/types'
import { logger } from '@likec4/log'
import {
  concat,
  difference,
  filter,
  flatMap,
  isEmpty,
  isNullish,
  isNumber,
  isTruthy,
  map,
  pipe,
  reverse,
  sort,
  take,
  unique,
} from 'remeda'
import {
  type AttributeListModel,
  type EdgeAttributeKey,
  type EdgeModel,
  type GraphBaseModel,
  type NodeAttributeKey,
  type NodeModel,
  type RootGraphModel,
  type SubgraphModel,
  attribute as _,
  digraph,
  toDot as modelToDot,
} from 'ts-graphviz'
import { compoundLabel, nodeLabel } from './dot-labels'
import type { DotSource } from './types'
import { compoundColor, compoundLabelColor, isCompound, pxToInch, pxToPoints } from './utils'

export const DefaultEdgeStyle = 'dashed' satisfies RelationshipLineType

const FontName = Theme.font

export type ApplyManualLayoutData = {
  x: number
  y: number
  height: number

  nodes: Array<{
    id: string
    center: XYPoint
    fixedsize?: {
      width: number
      height: number
    }
  }>

  edges: Array<{
    id: string
    dotpos: string
  }>
}

export abstract class DotPrinter<V extends ComputedView = ComputedView> {
  private ids = new Set<string>()
  private subgraphs = new Map<Fqn, SubgraphModel>()
  private nodes = new Map<Fqn, NodeModel>()
  protected edges = new Map<EdgeId, EdgeModel>()
  protected compoundIds: Set<Fqn>
  protected edgesWithCompounds: Set<EdgeId>

  public readonly graphvizModel: RootGraphModel

  constructor(protected view: V) {
    this.compoundIds = new Set(view.nodes.filter(isCompound).map(n => n.id))
    this.edgesWithCompounds = new Set(
      this.compoundIds.size > 0
        ? view.edges
          .filter(e => this.compoundIds.has(e.source) || this.compoundIds.has(e.target))
          .map(n => n.id)
        : [],
    )
    const G = this.graphvizModel = this.createGraph()
    this.applyNodeAttributes(G.attributes.node)
    this.applyEdgeAttributes(G.attributes.edge)
    this.build(G)
    this.postBuild(G)
  }

  public get hasEdgesWithCompounds(): boolean {
    return this.edgesWithCompounds.size > 0
  }

  protected postBuild(_G: RootGraphModel): void {
    // override in subclass
  }

  private build(G: RootGraphModel): void {
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
      const model = this.addEdge(edge, G)
      if (model) {
        this.edges.set(edge.id, model)
      }
    }
  }

  public print(): DotSource {
    return modelToDot(this.graphvizModel, {
      print: {
        indentStyle: 'space',
        indentSize: 2,
      },
    }) as DotSource
  }

  protected createGraph(): RootGraphModel {
    const autoLayout = this.view.autoLayout
    const G = digraph({
      [_.bgcolor]: 'transparent',
      [_.layout]: 'dot',
      [_.compound]: true,
      [_.rankdir]: autoLayout.direction,
      [_.TBbalance]: 'min',
      [_.splines]: 'spline',
      [_.outputorder]: 'nodesfirst',
      // [_.mclimit]: 5,
      // [_.nslimit]: 5,
      // [_.nslimit1]: 5,
      // [_.ratio]
      [_.nodesep]: pxToInch(autoLayout.nodeSep ?? 110),
      [_.ranksep]: pxToInch(autoLayout.rankSep ?? 120),
      [_.pack]: pxToPoints(autoLayout.rankSep ?? 120),
      [_.packmode]: 'array_3',
      [_.pad]: pxToInch(15),
      [_.fontname]: FontName,
    })
    G.attributes.graph.apply({
      [_.fontsize]: pxToPoints(15),
      [_.labeljust]: autoLayout.direction === 'RL' ? 'r' : 'l',
      [_.labelloc]: autoLayout.direction === 'BT' ? 'b' : 't',
      [_.margin]: 50.1, // space around clusters, but SVG output requires hack
    })

    return G
  }

  protected applyNodeAttributes(node: AttributeListModel<'Node', NodeAttributeKey>) {
    node.apply({
      [_.fontname]: FontName,
      [_.shape]: 'rect',
      [_.width]: pxToInch(320),
      [_.height]: pxToInch(180),
      [_.style]: 'filled',
      [_.penwidth]: 0,
    })
  }
  protected applyEdgeAttributes(edge: AttributeListModel<'Edge', EdgeAttributeKey>) {
    edge.apply({
      [_.arrowsize]: 0.75,
      [_.fontname]: FontName,
      [_.fontsize]: pxToPoints(14),
      [_.penwidth]: pxToPoints(2),
      [_.color]: Theme.relationships[DefaultRelationshipColor].lineColor,
      [_.fontcolor]: Theme.relationships[DefaultRelationshipColor].labelColor,
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
    const colorValues = this.getElementColorValues(compound.color)
    const textColor = compoundLabelColor(colorValues.loContrast)
    subgraph.apply({
      [_.likec4_id]: compound.id,
      [_.likec4_level]: compound.level,
      [_.likec4_depth]: compound.depth,
      [_.fillcolor]: compoundColor(colorValues.fill, compound.depth),
      [_.color]: compoundColor(colorValues.stroke, compound.depth),
      [_.style]: 'filled',
      [_.margin]: pxToPoints(compound.children.length > 1 ? 40 : 32),
    })
    if (!isEmpty(compound.title.trim())) {
      subgraph.set(_.label, compoundLabel(compound, textColor))
    }
    return subgraph
  }

  protected elementToNode(element: ComputedNode, node: NodeModel) {
    invariant(!isCompound(element), 'node should not be compound')
    const hasIcon = isTruthy(element.icon)
    const colorValues = this.getElementColorValues(element.color)
    node.attributes.apply({
      [_.likec4_id]: element.id,
      [_.likec4_level]: element.level,
      [_.fillcolor]: colorValues.fill,
      [_.fontcolor]: colorValues.hiContrast,
      [_.color]: colorValues.stroke,
      [_.margin]: `${pxToInch(hasIcon ? 10 : 26)},${pxToInch(26)}`,
    })
    switch (element.shape) {
      case 'cylinder':
      case 'storage': {
        node.attributes.apply({
          [_.margin]: `${pxToInch(hasIcon ? 10 : 26)},${pxToInch(0)}`,
          [_.penwidth]: pxToPoints(2),
          [_.shape]: 'cylinder',
        })
        break
      }
      case 'browser': {
        node.attributes.apply({
          [_.margin]: `${pxToInch(hasIcon ? 10 : 30)},${pxToInch(32)}`,
        })
        break
      }
      case 'mobile': {
        node.attributes.apply({
          [_.margin]: `${pxToInch(hasIcon ? 10 : 30)},${pxToInch(26)}`,
        })
        break
      }
      case 'queue': {
        node.attributes.apply({
          [_.width]: pxToInch(320),
          [_.height]: pxToInch(165),
          [_.margin]: `${pxToInch(hasIcon ? 10 : 30)},${pxToInch(26)}`,
        })
        break
      }
      default:
        break
    }
    // add label to the end
    node.attributes.set(_.label, nodeLabel(element, colorValues))
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
    return this.viewElement(parentId).children.flatMap(childId => {
      const child = this.viewElement(childId)
      return isCompound(child) ? this.leafElements(child.id) : child
    })
  }

  protected descendants(parentId: Fqn | null): ComputedNode[] {
    if (parentId === null) {
      return this.view.nodes.slice()
    }
    return this.viewElement(parentId).children.flatMap(childId => {
      const child = this.viewElement(childId)
      return [child, ...this.descendants(child.id)]
    })
  }

  protected viewElement(id: Fqn) {
    return nonNullable(
      this.view.nodes.find(n => n.id === id),
      `Node ${id} not found`,
    )
  }

  protected getGraphNode(id: Fqn) {
    return this.nodes.get(id) ?? null
  }

  protected getSubgraph(id: Fqn) {
    return this.subgraphs.get(id) ?? null
  }

  /**
   * In case edge has a cluster as endpoint,
   * pick nested node to use as endpoint
   */
  protected edgeEndpoint(
    endpointId: Fqn,
    pickFromCluster: (data: ComputedNode[]) => ComputedNode | undefined,
  ) {
    let element = this.viewElement(endpointId)
    let endpoint = this.getGraphNode(endpointId)
    // see https://graphviz.org/docs/attrs/lhead/
    let logicalEndpoint: string | undefined

    if (!endpoint) {
      invariant(isCompound(element), 'endpoint node should be compound')
      // Edge with cluster as endpoint
      logicalEndpoint = this.getSubgraph(endpointId)?.id
      invariant(logicalEndpoint, `subgraph ${endpointId} not found`)
      element = nonNullable(
        pickFromCluster(this.leafElements(endpointId)),
        `leaf element in ${endpointId} not found`,
      )
      endpoint = nonNullable(
        this.getGraphNode(element.id),
        `source graphviz node ${element.id} not found`,
      )
    }
    return [element, endpoint, logicalEndpoint] as const
  }

  protected findInternalEdges(parentId: Fqn | null): ComputedEdge[] {
    if (parentId === null) {
      return this.view.edges.slice()
    }
    const parent = this.viewElement(parentId)
    return pipe(
      this.descendants(parentId),
      flatMap(child => {
        return concat(child.inEdges, child.outEdges)
      }),
      unique(),
      difference(concat(parent.inEdges, parent.outEdges)),
      map(edgeId => this.view.edges.find(e => e.id === edgeId)),
      filter(isTruthy),
    )
  }

  protected withoutCompoundEdges(element: ComputedNode) {
    if (this.edgesWithCompounds.size === 0) {
      return element
    }
    return {
      ...element,
      inEdges: element.inEdges.filter(e => !this.edgesWithCompounds.has(e)),
      outEdges: element.outEdges.filter(e => !this.edgesWithCompounds.has(e)),
    }
  }

  protected assignGroups() {
    const groups = pipe(
      this.view.nodes,
      filter(isCompound),
      map(n => n.id),
      sort(compareFqnHierarchically),
      reverse(),
      map(id => {
        // edges only inside clusters, compound endpoints are not considered
        const edges = this.findInternalEdges(id).filter(e =>
          e.source !== e.target && !this.compoundIds.has(e.source) && !this.compoundIds.has(e.target)
        )
        return { id, edges }
      }),
      filter(({ edges }) => edges.length > 1 && edges.length < 8),
      // take only first 4 groups, otherwise grahviz eats the memory
      take(4),
    )

    const processed = new Set<Fqn>()
    for (const group of groups) {
      const edges = group.edges.filter(e => !processed.has(e.source) && !processed.has(e.target))
      for (const edge of edges) {
        try {
          const sourceNode = nonNullable(this.getGraphNode(edge.source), `Graphviz Node not found for ${edge.source}`)
          const targetNode = nonNullable(this.getGraphNode(edge.target), `Graphviz Node not found for ${edge.target}`)
          processed.add(edge.source)
          processed.add(edge.target)
          sourceNode.attributes.set(_.group, group.id)
          targetNode.attributes.set(_.group, group.id)
        } catch (e) {
          logger.error(e)
        }
      }
    }
  }

  /**
   * Use coordinates from given diagram as initial position for nodes
   * (try to keep existing layout as much as possible)
   */
  public applyManualLayout({ height, ...layout }: ApplyManualLayoutData): this {
    const offsetX = layout.x < 0 ? -layout.x : 0
    const offsetY = layout.y < 0 ? -layout.y : 0
    const isShifted = offsetX > 0 || offsetY > 0
    for (const { id, ...manual } of layout.nodes) {
      // we pin only nodes, not clusters
      const model = this.getGraphNode(id as Fqn)
      if (!model) {
        continue
      }

      // Invert Y axis and convert to inches
      const x = pxToInch(manual.center.x) + offsetX
      const y = pxToInch(height - manual.center.y)
      if (manual.fixedsize) {
        model.attributes.apply({
          [_.pos]: `${x},${y}!`,
          [_.pin]: true,
          [_.width]: pxToInch(manual.fixedsize.width),
          [_.height]: pxToInch(manual.fixedsize.height),
          [_.fixedsize]: true,
        })
      } else {
        // Not pinned, but suggested position
        model.attributes.set(_.pos, `${x},${y}`)
      }
    }
    for (const [id, edgeModel] of this.edges.entries()) {
      edgeModel.attributes.delete(_.weight)
      edgeModel.attributes.delete(_.minlen)
      edgeModel.attributes.delete(_.constraint)
      const dotpos = layout.edges.find(e => e.id === id)?.dotpos
      if (dotpos && !isShifted) {
        edgeModel.attributes.set(_.pos, dotpos)
      }
    }
    // TODO: apply manual layout fails when there are edges with compounds
    // Array.from(this.edgesWithCompounds.values()).forEach(edgeId => {
    //   const edge = this.edges.get(edgeId)!
    //   if (!edge) {
    //     return
    //   }
    //   const source = edge.attributes.get(_.ltail) ?? edge.targets[0]
    //   const target = edge.attributes.get(_.lhead) ?? edge.targets[1]

    //   edge.attributes.delete(_.ltail)
    //   edge.attributes.delete(_.lhead)

    //   const xlabel = edge.attributes.get(_.xlabel)
    //   if (xlabel) {
    //     edge.attributes.delete(_.xlabel)
    //     edge.attributes.set(_.label, xlabel)
    //   }
    //   this.graphvizModel.edge([source, target]).attributes.apply(edge.attributes.values)
    //   this.graphvizModel.removeEdge(edge)
    // })

    this.graphvizModel.apply({
      [_.layout]: 'fdp',
      // [_.scale]: 72.0,
      [_.overlap]: 'vpsc',
      [_.sep]: '+50,50',
      [_.esep]: '+10,10',
      [_.start]: 'random2',
      [_.splines]: 'compound',
    })
    this.graphvizModel.delete(_.compound)
    this.graphvizModel.delete(_.rankdir)
    this.graphvizModel.delete(_.nodesep)
    this.graphvizModel.delete(_.ranksep)
    this.graphvizModel.delete(_.pack)
    this.graphvizModel.delete(_.pad)
    this.graphvizModel.delete(_.packmode)
    this.graphvizModel.attributes.graph.delete(_.margin)
    return this
  }
  protected getRelationshipColorValues(color: Color): RelationshipThemeColorValues {
    return isThemeColor(color)
      ? Theme.relationships[color]
      : this.view.customColorDefinitions[color]?.relationships ?? Theme.relationships[DefaultThemeColor]
  }
  protected getElementColorValues(color: Color): ElementThemeColorValues {
    return isThemeColor(color)
      ? Theme.elements[color]
      : this.view.customColorDefinitions[color]?.elements ?? Theme.elements[DefaultThemeColor]
  }
}
