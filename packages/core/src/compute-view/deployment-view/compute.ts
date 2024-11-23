import {
  filter,
  flatMap,
  hasAtLeast,
  isDeepEqual,
  isEmpty,
  isNonNullish,
  isTruthy,
  last,
  map,
  omitBy,
  only,
  pickBy,
  pipe,
  reduce,
  reverse,
  sort,
  unique
} from 'remeda'
import { invariant, nonexhaustive, nonNullable } from '../../errors'
import type {
  Color,
  ComputedDeploymentView,
  ComputedEdge,
  ComputedNode,
  DeploymentNode,
  DeploymentNodeKind,
  DeploymentView,
  DeploymentViewRulePredicate,
  EdgeId,
  NonEmptyArray,
  RelationshipArrowType,
  RelationshipKind,
  RelationshipLineType,
  Tag,
  ViewID
} from '../../types'
import {
  DefaultArrowType,
  DeploymentElementExpression,
  DeploymentExpression,
  DeploymentRelationExpression,
  type Fqn,
  isViewRuleAutoLayout,
  isViewRulePredicate
} from '../../types'
import { commonHead } from '../../utils/commonHead'
import { ancestorsFqn, commonAncestor, isAncestor, nameFromFqn } from '../../utils/fqn'
import { compareRelations } from '../../utils/relations'
import type { LikeC4DeploymentGraph } from '../LikeC4DeploymentGraph'
import { ancestorsOfNode } from '../utils/ancestorsOfNode'
import { applyDeploymentViewRuleStyles } from '../utils/applyViewRuleStyles'
import { buildComputedNodes, type ComputedNodeSource } from '../utils/buildComputedNodes'
import { sortNodes } from '../utils/sortNodes'
import { uniqueTags } from '../utils/uniqueTags'
import { calcViewLayoutHash } from '../utils/view-hash'
import {
  excludeDeploymentRef,
  excludeDirectRelation,
  excludeWildcard,
  includeDeploymentRef,
  includeDirectRelation,
  includeWildcard
} from './predicates'

type DeploymentElement = LikeC4DeploymentGraph.Instance | DeploymentNode
type DeploymentEdge = LikeC4DeploymentGraph.Edge
type Edges = ReadonlyArray<DeploymentEdge>

function toNodeSource(el: DeploymentElement): ComputedNodeSource {
  const isNode = 'kind' in el
  if (isNode) {
    const {
      icon,
      color,
      shape,
      ...style
    } = el.style ?? {}
    return {
      ...el,
      ...icon && { icon },
      ...color && { color },
      ...shape && { shape },
      style: {
        border: 'dashed',
        opacity: 20,
        ...style
      },
      deploymentRef: 1
    }
  }

  const icon = el.instance.style?.icon ?? el.element.icon
  const color = el.instance.style?.color ?? el.element.color
  const shape = el.instance.style?.shape ?? el.element.shape

  const links = [
    ...(el.element.links ?? []),
    ...(el.instance.links ?? [])
  ]

  const metadata = {
    ...el.element.metadata,
    ...el.instance.metadata
  }

  return {
    ...pickBy(el.element, isNonNullish),
    ...pickBy(el.instance, isNonNullish),
    id: el.id,
    kind: 'instance' as DeploymentNodeKind,
    tags: uniqueTags([el.element, el.instance]) as NonEmptyArray<Tag>,
    links: hasAtLeast(links, 1) ? links : null,
    ...icon && { icon },
    ...color && { color },
    ...shape && { shape },
    style: {
      ...el.element.style,
      ...el.instance.style
    },
    deploymentRef: el.id === el.instance.id ? 1 : el.instance.id,
    modelRef: el.id === el.element.id ? 1 : el.element.id,
    ...!isEmpty(metadata) && ({ metadata })
  }
}

export class DeploymentViewComputeCtx {
  // Intermediate state
  private _explicits = new Map<Fqn, DeploymentElement>()

  // Implicit elements (initiator -> what added)
  private _implicits = new Map<Fqn, DeploymentElement>()
  // private implicits = new Map<DeploymentElement, Set<DeploymentElement>>()
  // Implicit backlinks (what added -> by whom)
  // private implicitBackLinks = new Map<DeploymentElement, Set<DeploymentElement>>()

  private _edges = [] as DeploymentEdge[]

  public static compute(view: DeploymentView, graph: LikeC4DeploymentGraph): ComputedDeploymentView {
    return new DeploymentViewComputeCtx(view, graph).compute()
  }

  private constructor(
    readonly view: DeploymentView,
    readonly graph: LikeC4DeploymentGraph
  ) {}

  protected compute(): ComputedDeploymentView {
    const {
      docUri: _docUri, // exclude docUri
      rules, // exclude rules
      ...view
    } = this.view

    const autoLayoutRule = rules.findLast(isViewRuleAutoLayout)

    for (const rule of rules) {
      if (isViewRulePredicate(rule)) {
        this.processPredicate(rule)
      }
    }
    this.removeRedundantImplicitEdges()

    // Temporary workaround - transform deployment elements to model elements
    // Because the rest of the code expects model elements and we want to minimize changes for now
    const elements = [...this.includedElements].map(toNodeSource)
    const nodesMap = buildComputedNodes(elements)

    const edges = this.computeEdges()

    this.linkNodesAndEdges(nodesMap, edges)

    // nodesMap sorted hierarchically,
    // but we need to keep the initial sort
    let initialSort = elements.map(e => nonNullable(nodesMap.get(e.id), `Node ${e.id} not found in nodesMap`))

    const nodes = applyDeploymentViewRuleStyles(
      rules,
      // Build graph and apply postorder sort
      sortNodes({
        nodes: initialSort,
        edges
      })
    )

    return calcViewLayoutHash({
      ...view,
      autoLayout: {
        direction: autoLayoutRule?.direction ?? 'TB',
        ...(autoLayoutRule?.nodeSep && { nodeSep: autoLayoutRule.nodeSep }),
        ...(autoLayoutRule?.rankSep && { rankSep: autoLayoutRule.rankSep })
      },
      nodes,
      edges
    })
  }

  protected processPredicate(rule: DeploymentViewRulePredicate): this {
    const isInclude = 'include' in rule
    const exprs = rule.include ?? rule.exclude
    for (const expr of exprs) {
      if (DeploymentElementExpression.isRef(expr)) {
        isInclude ? includeDeploymentRef(this, expr) : excludeDeploymentRef(this, expr)
        continue
      }
      if (DeploymentElementExpression.isWildcard(expr)) {
        isInclude ? includeWildcard(this) : excludeWildcard(this)
        continue
      }
      if (DeploymentRelationExpression.isDirect(expr)) {
        isInclude ? includeDirectRelation(this, expr) : excludeDirectRelation(this, expr)
        continue
      }
      if (DeploymentExpression.isRelation(expr)) {
        // Ignore for now
        continue
      }
      nonexhaustive(expr)
    }
    return this
  }

  protected computeEdges(): ComputedEdge[] {
    return this._edges.reduce((acc, e) => {
      // invariant(hasAtLeast(e.relations, 1), 'Edge must have at least one relation')
      const relations = sort([...e.relations], compareRelations)
      const source = e.source.id
      const target = e.target.id

      const tags = uniqueTags(relations)
      // Most closest relation
      const relation = only(relations) // || relations.find(r => r.source === source && r.target === target)

      // This edge represents mutliple relations
      // We use label if only it is the same for all relations
      const title = isTruthy(relation?.title) ? relation.title : pipe(
        relations,
        map(r => r.title),
        filter(isTruthy),
        unique(),
        only()
      )

      const navigateTo = !!relation?.navigateTo ? relation.navigateTo : pipe(
        relations,
        map(r => r.navigateTo),
        filter(isTruthy),
        unique(),
        only()
      )

      const edge: ComputedEdge = {
        id: `${source}:${target}` as EdgeId,
        parent: commonAncestor(source, target),
        source,
        target,
        label: title ?? null,
        relations: relations.map(r => r.id),
        ...tags && { tags: tags as NonEmptyArray<Tag> },
        ...navigateTo && { navigateTo }
      }

      // If exists same edge but in opposite direction
      const existing = acc.find(e => e.source === target && e.target === source)
      if (existing && isDeepEqual(existing.relations, edge.relations)) {
        existing.head = DefaultArrowType
        existing.tail = DefaultArrowType
        return acc
      }

      acc.push(edge)
      return acc
    }, [] as ComputedEdge[])
  }

  /**
   * Iterate over edges and assign `outEdges` and `inEdges` of nodes
   */
  protected linkNodesAndEdges(nodesMap: ReadonlyMap<Fqn, ComputedNode>, edges: ComputedEdge[]) {
    for (const edge of edges) {
      const source = nodesMap.get(edge.source)
      const target = nodesMap.get(edge.target)
      invariant(source, `Source node ${edge.source} not found`)
      invariant(target, `Target node ${edge.target} not found`)
      // These ancestors are reversed: from bottom to top
      const sourceAncestors = [...ancestorsOfNode(source, nodesMap)]
      const targetAncestors = [...ancestorsOfNode(target, nodesMap)]

      const edgeParent = last(
        commonHead(
          reverse(sourceAncestors),
          reverse(targetAncestors)
        )
      )
      edge.parent = edgeParent?.id ?? null
      source.outEdges.push(edge.id)
      target.inEdges.push(edge.id)
      // Process edge source ancestors
      for (const sourceAncestor of sourceAncestors) {
        if (sourceAncestor === edgeParent) {
          break
        }
        sourceAncestor.outEdges.push(edge.id)
      }
      // Process target hierarchy
      for (const targetAncestor of targetAncestors) {
        if (targetAncestor === edgeParent) {
          break
        }
        targetAncestor.inEdges.push(edge.id)
      }
    }
  }

  public isExplicit(el: DeploymentElement): boolean {
    return this._explicits.has(el.id)
  }

  public isImplicit(el: DeploymentElement): boolean {
    return this.hasElement(el) && !this.isExplicit(el)
  }

  public hasElement(el: DeploymentElement): boolean {
    return this._explicits.has(el.id) || this._implicits.has(el.id)
      || this._edges.some(e => e.source.id === el.id || e.target.id === el.id)
  }

  public get includedElements() {
    return new Set([
      ...this._explicits.values(),
      ...this._edges.flatMap(e => [e.source, e.target])
    ]) as ReadonlySet<DeploymentElement>
  }

  public get resolvedElements() {
    return new Set([
      ...this._explicits.values(),
      ...this._implicits.values(),
      ...this._edges.flatMap(e => [e.source, e.target])
    ]) as ReadonlySet<DeploymentElement>
  }

  public get edges() {
    return this._edges.slice() as ReadonlyArray<DeploymentEdge>
  }

  public get explicits() {
    return [...this._explicits.values()] as ReadonlyArray<DeploymentElement>
  }

  public get implicits() {
    return [...this._implicits.values()] as ReadonlyArray<DeploymentElement>
  }

  // public includedA(el: DeploymentElement) {
  //   this.graph.ascendingSiblings(el).filter()
  // }

  public addElement(...elements: DeploymentElement[]): void {
    for (const el of elements) {
      this._explicits.set(el.id, el)
      this._implicits.delete(el.id)
    }
  }

  public addImplicit(...elements: DeploymentElement[]): void {
    for (const el of elements) {
      if (this._explicits.has(el.id)) {
        continue
      }
      this._implicits.set(el.id, el)
    }
  }

  public excludeElement(...elements: DeploymentElement[]): void {
    const excluded = new Set<Fqn>()
    for (const el of elements) {
      this._explicits.delete(el.id)
      this._implicits.delete(el.id)
      excluded.add(el.id)
    }
    this._edges = this._edges.filter(e => !excluded.has(e.source.id) && !excluded.has(e.target.id))
  }

  public excludeImplicit(...elements: DeploymentElement[]): void {
    for (const el of elements) {
      this._implicits.delete(el.id)
    }
  }

  public addEdges(edges: Edges) {
    const added = [] as DeploymentEdge[]
    for (const e of edges) {
      if (e.relations.size === 0) {
        continue
      }
      const existing = this._edges.find(
        _e => _e.source.id === e.source.id && _e.target.id === e.target.id
      )
      if (existing) {
        existing.relations = new Set([...existing.relations, ...e.relations])
        added.push(existing)
        continue
      }
      added.push(e)
      this._edges.push(e)
    }
    return added as ReadonlyArray<DeploymentEdge>
  }

  public removeEdges<E extends Pick<DeploymentEdge, 'source' | 'target'>>(edges: ReadonlyArray<E>) {
    const ids = pipe(
      edges,
      // flatMap(([source, target]) => [
      //   [source, target],
      //   ...this.ancestors(source.id).map(e => [e, target] as const),
      //   ...this.ancestors(target.id).map(e => [source, e] as const)
      // ]),
      map(({ source, target }) => `${source.id}:${target.id}`)
    )
    const removed = [] as DeploymentEdge[]
    this._edges = this._edges.reduce((acc, e) => {
      if (ids.includes(`${e.source.id}:${e.target.id}`)) {
        removed.push(e)
        return acc
      }
      acc.push(e)
      return acc
    }, removed.slice())
    return removed as ReadonlyArray<DeploymentEdge>
  }

  public reset(): void {
    this._edges = []
    this._explicits.clear()
    this._implicits.clear()
  }

  public *ancestors(fqn: Fqn) {
    for (const anc of ancestorsFqn(fqn)) {
      const el = this._explicits.get(anc) || this._implicits.get(anc)
      if (el) {
        yield el
      }
    }
  }

  private removeRedundantImplicitEdges() {
    // copy edges to avoid mutationq
    const alledges = this._edges.map(({ relations, ...e }) => {
      return {
        relations: new Set(relations),
        ...e
      }
    })
    this._edges = this._edges.filter(({ source, target, relations }) => {
      for (const e of alledges) {
        if (
          isAncestor(source.id, e.source.id) && isAncestor(target.id, e.target.id)
          || isAncestor(source.id, e.source.id) && e.target === target
          || isAncestor(target.id, e.target.id) && e.source === source
        ) {
          for (const rel of e.relations) {
            relations.delete(rel)
          }
          if (relations.size === 0) {
            break
          }
        }
      }
      return relations.size > 0
    })
  }

  protected getEdgeLabel(
    relation: {
      title: string
      technology?: string | undefined
    }
  ) {
    const labelParts: string[] = []

    if (isTruthy(relation.title)) {
      labelParts.push(relation.title)
    }

    if (isTruthy(relation.technology)) {
      labelParts.push(`[${relation.technology}]`)
    }

    return labelParts.length > 0 ? { label: labelParts.join('\n') } : {}
  }
}
