import type { LikeC4Styles } from '@likec4/core/styles'
import type {
  AnyFqn,
  ComputedEdge,
  ComputedNode,
  ComputedView,
  DeploymentFqn,
  EdgeId,
  Fqn,
  HexColor,
  LikeC4StyleDefaults,
  NodeId,
  RelationshipColorValues,
  RelationshipLineType,
} from '@likec4/core/types'
import {
  compareFqnHierarchically,
  DefaultMap,
  hierarchyDistance,
  invariant,
  nameFromFqn,
  nonNullable,
} from '@likec4/core/utils'
import { Graph } from '@likec4/core/utils/graphology'
import { createLogger } from '@likec4/log'

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

const FontName = 'Arial'

const logger = createLogger('dot')

type ViewToPrint = Pick<ComputedView, 'id' | 'nodes' | 'edges' | 'autoLayout'>
type NodeOf<V extends ViewToPrint> = V['nodes'][number]
type EdgeOf<V extends ViewToPrint> = V['edges'][number]

type GraphologyNodeAttributes<V extends ViewToPrint> = {
  modelRef: Fqn | null
  deploymentRef: DeploymentFqn | null
  origin: NodeOf<V>
  level: number
  depth: number
  maxConnectedHierarchyDistance: number
}
type GraphologyEdgeAttributes<V extends ViewToPrint> = {
  origin: EdgeOf<V>
  weight: number
  hierarchyDistance: number
}

// space around clusters, but SVG output requires hack
export const GraphClusterSpace = 50.1

export abstract class DotPrinter<V extends ViewToPrint> {
  private ids = new Set<string>()
  private subgraphs = new Map<NodeId, SubgraphModel>()
  private nodes = new Map<NodeId, NodeModel>()
  protected edges = new Map<EdgeId, EdgeModel>()
  protected compoundIds: Set<NodeId>
  protected edgesWithCompounds: Set<EdgeId>
  protected viewNodes = new DefaultMap<NodeId, NodeOf<V>>(id =>
    nonNullable(
      this.view.nodes.find(n => n.id === id),
      `Node ${id} not found`,
    )
  )

  protected logger = logger

  protected graphology: Graph<GraphologyNodeAttributes<V>, GraphologyEdgeAttributes<V>> = new Graph({
    allowSelfLoops: true,
    multi: true,
    type: 'directed',
  })

  /**
   * The root graphviz model
   * @internal
   */
  public readonly G: RootGraphModel

  constructor(
    protected readonly view: V,
    protected readonly styles: LikeC4Styles,
  ) {
    this.compoundIds = new Set(view.nodes.filter(isCompound).map(n => n.id))
    this.edgesWithCompounds = new Set(
      this.compoundIds.size > 0
        ? view.edges
          .filter(e => this.compoundIds.has(e.source) || this.compoundIds.has(e.target))
          .map(n => n.id)
        : [],
    )
    for (const node of view.nodes) {
      this.graphology.addNode(node.id, {
        origin: node,
        level: node.level,
        depth: node.depth ?? 0,
        modelRef: node.modelRef ?? null,
        deploymentRef: node.deploymentRef ?? null,
        maxConnectedHierarchyDistance: 0,
      })
    }

    for (const edge of view.edges) {
      // First compare deploymentRef of any
      let sourceFqn: AnyFqn | null = this.graphology.getNodeAttribute(edge.source, 'deploymentRef')
      let targetFqn: AnyFqn | null = this.graphology.getNodeAttribute(edge.target, 'deploymentRef')
      if (sourceFqn === null || targetFqn === null) {
        // Then compare modelRef
        sourceFqn = this.graphology.getNodeAttribute(edge.source, 'modelRef')
        targetFqn = this.graphology.getNodeAttribute(edge.target, 'modelRef')
      }

      let distance = -1
      if (sourceFqn !== null && targetFqn !== null) {
        distance = hierarchyDistance(sourceFqn, targetFqn)
      }

      this.graphology.addEdgeWithKey(edge.id, edge.source, edge.target, {
        origin: edge,
        hierarchyDistance: distance,
        weight: 1,
      })

      if (distance > this.graphology.getNodeAttribute(edge.source, 'maxConnectedHierarchyDistance')) {
        this.graphology.mergeNodeAttributes(edge.source, {
          maxConnectedHierarchyDistance: distance,
        })
      }
      if (distance > this.graphology.getNodeAttribute(edge.target, 'maxConnectedHierarchyDistance')) {
        this.graphology.mergeNodeAttributes(edge.target, {
          maxConnectedHierarchyDistance: distance,
        })
      }
    }

    this.graphology.forEachEdge((edgeId, { hierarchyDistance }, _s, _t, sourceAttributes, targetAttributes) => {
      const maxDistance = Math.max(
        sourceAttributes.maxConnectedHierarchyDistance,
        targetAttributes.maxConnectedHierarchyDistance,
      )
      if (maxDistance > hierarchyDistance) {
        this.graphology.mergeEdgeAttributes(edgeId, {
          weight: maxDistance - hierarchyDistance + 1,
        })
      } else {
        const sourceDegree = this.graphology.directedDegree(_s)
        const targetDegree = this.graphology.directedDegree(_t)
        if (sourceDegree === 1 && targetDegree === 1 && hierarchyDistance > 1) {
          this.graphology.mergeEdgeAttributes(edgeId, {
            weight: hierarchyDistance,
          })
        }
      }
    })

    const G = this.G = this.createGraph()
    this.applyNodeAttributes(G.attributes.node)
    this.applyEdgeAttributes(G.attributes.edge)
  }

  protected get $defaults(): LikeC4StyleDefaults {
    return this.styles.defaults
  }

  public get hasEdgesWithCompounds(): boolean {
    return this.edgesWithCompounds.size > 0
  }

  protected get defaultRelationshipColors(): RelationshipColorValues {
    const colorValues = this.styles.relationshipColors
    return {
      line: colorValues.line,
      label: colorValues.label as HexColor,
      labelBg: colorValues.labelBg,
    }
  }

  protected postBuild(_G: RootGraphModel): void {
    // override in subclass
  }

  /**
   * Override this method to reorder/filter nodes that should be included in the view
   * Does not affect compound nodes - they are always processed
   * By default, all nodes from the view are included
   */
  protected selectViewNodes(): Iterable<NodeOf<V>> {
    return this.view.nodes
  }

  /**
   * Override this method to filter edges that should be included in the view
   * By default, all edges from the view are included
   */
  protected selectViewEdges(): Iterable<EdgeOf<V>> {
    return this.view.edges
  }

  private build(): this {
    const G = this.G
    // ----------------------------------------------
    // Traverse nodes
    const topCompound = [] as ComputedNode[]
    for (const viewNode of this.selectViewNodes()) {
      if (isCompound(viewNode)) {
        if (isNullish(viewNode.parent)) {
          topCompound.push(viewNode)
        }
      } else {
        const id = this.generateGraphvizId(viewNode)
        const node = this.elementToNode(viewNode, G.node(id))
        this.nodes.set(viewNode.id, node)
      }
    }

    // ----------------------------------------------
    // Traverse clusters after nodes are added to the graphviz model
    const traverseClusters = (element: ComputedNode, parent: GraphBaseModel) => {
      const id = this.generateGraphvizId(element)
      const subgraph = this.elementToSubgraph(element, parent.subgraph(id))
      this.subgraphs.set(element.id, subgraph)
      for (const childId of element.children) {
        const child = this.computedNode(childId)
        if (isCompound(child)) {
          traverseClusters(child, subgraph)
        } else {
          const gvnode = this.getGraphNode(child.id)
          if (gvnode) {
            subgraph.node(gvnode.id)
          }
        }
      }
    }

    for (const compound of topCompound) {
      traverseClusters(compound, G)
    }

    // ----------------------------------------------
    // Traverse edges
    for (const edge of this.selectViewEdges()) {
      const model = this.addEdge(edge, G)
      if (model) {
        this.edges.set(edge.id, model)
      }
    }

    return this
  }

  public print(): DotSource {
    this.build()
    this.postBuild(this.G)
    return modelToDot(this.G, {
      print: {
        indentStyle: 'space',
        indentSize: 2,
      },
    }) as DotSource
  }

  protected enableNewRankIfNeeded(): this {
    if (this.G.subgraphs.some(s => !!s.get(_.rank))) {
      this.G.set(_.newrank, true)
      // this.graphvizModel.set(_.clusterrank, 'global')
    }
    return this
  }

  protected createGraph(): RootGraphModel {
    const autoLayout = this.view.autoLayout
    const direction = autoLayout.direction
    const G = digraph({
      [_.likec4_viewId]: this.view.id,
      [_.bgcolor]: 'transparent',
      [_.layout]: 'dot',
      [_.compound]: true,
      [_.rankdir]: direction,
      [_.TBbalance]: 'min',
      [_.splines]: 'spline',
      [_.outputorder]: 'nodesfirst',
      [_.nodesep]: pxToInch(autoLayout.nodeSep ?? 110),
      [_.ranksep]: pxToInch(autoLayout.rankSep ?? 120),
      [_.pad]: pxToInch(15),
      [_.fontname]: FontName,
    })
    G.attributes.graph.apply({
      [_.fontsize]: pxToPoints(this.styles.fontSize()),
      [_.labeljust]: direction === 'RL' ? 'r' : 'l',
      [_.labelloc]: direction === 'BT' ? 'b' : 't',
      [_.margin]: GraphClusterSpace,
    })

    return G
  }

  protected applyNodeAttributes(node: AttributeListModel<'Node', NodeAttributeKey>) {
    const colors = this.styles.elementColors
    node.apply({
      [_.fontname]: FontName,
      [_.shape]: 'rect',
      [_.fillcolor]: colors.fill,
      [_.fontcolor]: colors.hiContrast as HexColor,
      [_.color]: colors.stroke,
      [_.style]: 'filled',
      [_.penwidth]: 0,
    })
  }
  protected applyEdgeAttributes(edge: AttributeListModel<'Edge', EdgeAttributeKey>) {
    const colors = this.defaultRelationshipColors
    edge.apply({
      [_.arrowsize]: 0.75,
      [_.fontname]: FontName,
      [_.fontsize]: pxToPoints(14),
      [_.penwidth]: pxToPoints(2),
      [_.color]: colors.line,
      [_.fontcolor]: colors.label as HexColor,
      [_.style]: this.$defaults.relationship.line,
    })
  }

  private reserveNodeId(name: string, isCompound = false): string | false {
    if (isCompound) {
      name = 'cluster_' + name
    } else if (name.toLowerCase().startsWith('cluster')) {
      name = 'nd_' + name
    }
    if (this.ids.has(name)) {
      return false
    }
    this.ids.add(name)
    return name
  }

  protected generateGraphvizId(node: NodeOf<V>) {
    const _compound = isCompound(node)
    const name = nameFromFqn(node.id).toLowerCase()
    let id = this.reserveNodeId(name, _compound)
    // use post-index
    let i = 1
    while (id === false) {
      id = this.reserveNodeId(name + '_' + i++, _compound)
    }
    return id
  }

  protected elementToSubgraph(compound: NodeOf<V>, subgraph: SubgraphModel) {
    invariant(isCompound(compound), 'node should be compound')
    invariant(isNumber(compound.depth), 'node.depth should be defined')
    const colorValues = this.styles.colors(compound.color).elements
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

  protected elementToNode(element: NodeOf<V>, node: NodeModel) {
    invariant(!isCompound(element), 'node should not be compound')
    const hasIcon = isTruthy(element.icon)
    const { values: { padding, sizes: { width, height } } } = this.styles.nodeSizes(element.style)

    let paddingX = hasIcon ? 8 : padding

    node.attributes.apply({
      [_.likec4_id]: element.id,
      [_.likec4_level]: element.level,
      [_.label]: nodeLabel(element, this.styles),
      [_.margin]: `${pxToInch(paddingX)},${pxToInch(padding)}`,
    })

    node.attributes.set(_.width, pxToInch(width))
    node.attributes.set(_.height, pxToInch(height))

    if (!this.styles.isDefaultColor(element.color)) {
      const colorValues = this.styles.colors(element.color).elements
      node.attributes.apply({
        [_.fillcolor]: colorValues.fill,
        [_.fontcolor]: colorValues.hiContrast as HexColor,
        [_.color]: colorValues.stroke,
      })
    }
    switch (element.shape) {
      case 'cylinder':
      case 'storage': {
        node.attributes.apply({
          [_.margin]: `${pxToInch(paddingX)},${pxToInch(0)}`,
          [_.penwidth]: pxToPoints(2),
          [_.shape]: 'cylinder',
        })
        break
      }
      case 'browser': {
        node.attributes.apply({
          [_.margin]: `${pxToInch(hasIcon ? paddingX : paddingX + 4)},${pxToInch(padding + 6)}`,
        })
        break
      }
      case 'mobile': {
        node.attributes.apply({
          [_.margin]: `${pxToInch(hasIcon ? paddingX : paddingX + 4)},${pxToInch(padding)}`,
        })
        break
      }
      case 'queue': {
        node.attributes.apply({
          [_.width]: pxToInch(width),
          [_.height]: pxToInch(height - 8),
          [_.margin]: `${pxToInch(hasIcon ? paddingX : paddingX + 4)},${pxToInch(padding)}`,
        })
        break
      }
      case 'component': {
        node.attributes.apply({
          [_.width]: pxToInch(width + 10),
          [_.margin]: `${pxToInch(paddingX + 20)},${pxToInch(padding)}`,
        })
        break
      }
      default:
        break
    }
    return node
  }

  /**
   * ElementView and DynamicView have different implementation
   */
  protected abstract addEdge(edge: EdgeOf<V>, G: RootGraphModel): EdgeModel | null

  protected leafElements(parentId: NodeId | null): NodeOf<V>[] {
    if (parentId === null) {
      return filter([...this.selectViewNodes()], n => !isCompound(n))
    }
    return this.computedNode(parentId).children.flatMap(childId => {
      const child = this.computedNode(childId)
      return isCompound(child) ? this.leafElements(child.id) : [child]
    })
  }

  protected descendants(parentId: NodeId | null): NodeOf<V>[] {
    if (parentId === null) {
      return [...this.selectViewNodes()]
    }
    return this.computedNode(parentId).children.flatMap(childId => {
      const child = this.computedNode(childId)
      return [child, ...this.descendants(child.id)]
    })
  }

  protected computedNode(id: NodeId): NodeOf<V> {
    return this.viewNodes.get(id)
  }

  protected getGraphNode(id: NodeId): NodeModel | null {
    return this.nodes.get(id) ?? null
  }

  protected getSubgraph(id: NodeId): SubgraphModel | null {
    return this.subgraphs.get(id) ?? null
  }

  /**
   * In case edge has a cluster as endpoint,
   * pick nested node to use as endpoint
   */
  protected edgeEndpoint(
    endpointId: NodeId,
    pickFromCluster: (data: NodeOf<V>[]) => NodeOf<V> | undefined,
  ): [NodeOf<V>, NodeModel, string | undefined] {
    let element = this.computedNode(endpointId)
    let endpoint = this.getGraphNode(endpointId)
    // see https://graphviz.org/docs/attrs/lhead/
    let logicalEndpoint: string | undefined

    if (endpoint) {
      return [element, endpoint, undefined]
    }

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
    return [element, endpoint, logicalEndpoint]
  }

  protected findInternalEdges(parentId: NodeId | null): EdgeOf<V>[] {
    if (parentId === null) {
      return this.view.edges.slice()
    }
    const parent = this.computedNode(parentId)
    return pipe(
      this.descendants(parentId as NodeId),
      flatMap(child => {
        return concat(child.inEdges, child.outEdges)
      }),
      unique(),
      difference(concat(parent.inEdges, parent.outEdges)),
      map(edgeId => this.view.edges.find(e => e.id === edgeId)),
      filter(isTruthy),
    )
  }

  protected assignGroups(): this {
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
        } catch (error) {
          logger.error(`Failed to assign group to edge ${edge.id}`, { error })
        }
      }
    }
    return this
  }
}
