import {
  filter,
  hasAtLeast,
  isEmpty,
  isNonNullish,
  isTruthy,
  last,
  omitBy,
  only,
  pickBy,
  pipe,
  reduce,
  reverse,
  sort
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
import { DeploymentExpression, type Fqn, isViewRuleAutoLayout, isViewRulePredicate } from '../../types'
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
import { excludeDeploymentRef, excludeWildcard, includeDeploymentRef, includeWildcard } from './predicates'

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
  private explicits = new Map<Fqn, DeploymentElement>()

  // Implicit elements (initiator -> what added)
  private implicits = new Map<Fqn, DeploymentElement>()
  // private implicits = new Map<DeploymentElement, Set<DeploymentElement>>()
  // Implicit backlinks (what added -> by whom)
  // private implicitBackLinks = new Map<DeploymentElement, Set<DeploymentElement>>()

  private edges = [] as DeploymentEdge[]

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
      if (DeploymentExpression.isRef(expr)) {
        isInclude ? includeDeploymentRef(this, expr) : excludeDeploymentRef(this, expr)
        continue
      }
      if (DeploymentExpression.isWildcard(expr)) {
        isInclude ? includeWildcard(this) : excludeWildcard(this)
        continue
      }
      nonexhaustive(expr)
    }
    return this
  }

  protected computeEdges(): ComputedEdge[] {
    return this.edges.map((e): ComputedEdge => {
      // invariant(hasAtLeast(e.relations, 1), 'Edge must have at least one relation')
      const relations = sort([...e.relations], compareRelations)
      const source = e.source.id
      const target = e.target.id

      const edge: ComputedEdge = {
        id: `${source}:${target}` as EdgeId,
        parent: commonAncestor(source, target),
        source,
        target,
        label: null,
        relations: relations.map(r => r.id)
      }

      let relation: {
        // TODO refactor with type-fest
        title: string
        description?: string | undefined
        technology?: string | undefined
        kind?: RelationshipKind | undefined
        color?: Color | undefined
        line?: RelationshipLineType | undefined
        head?: RelationshipArrowType | undefined
        tail?: RelationshipArrowType | undefined
        tags?: NonEmptyArray<Tag>
        navigateTo?: ViewID | undefined
      } | undefined
      relation = only(relations) ?? pipe(
        relations,
        filter(r => r.source === source && r.target === target),
        only()
      )

      // This edge represents mutliple relations
      // We use label if only it is the same for all relations
      if (!relation) {
        const allprops = pipe(
          relations,
          reduce((acc, r) => {
            if (isTruthy(r.title) && !acc.title.includes(r.title)) {
              acc.title.push(r.title)
            }
            if (isTruthy(r.description) && !acc.description.includes(r.description)) {
              acc.description.push(r.description)
            }
            if (isTruthy(r.technology) && !acc.technology.includes(r.technology)) {
              acc.technology.push(r.technology)
            }
            if (isTruthy(r.kind) && !acc.kind.includes(r.kind)) {
              acc.kind.push(r.kind)
            }
            if (isTruthy(r.color) && !acc.color.includes(r.color)) {
              acc.color.push(r.color)
            }
            if (isTruthy(r.line) && !acc.line.includes(r.line)) {
              acc.line.push(r.line)
            }
            if (isTruthy(r.head) && !acc.head.includes(r.head)) {
              acc.head.push(r.head)
            }
            if (isTruthy(r.tail) && !acc.tail.includes(r.tail)) {
              acc.tail.push(r.tail)
            }
            if (isTruthy(r.navigateTo) && !acc.navigateTo.includes(r.navigateTo)) {
              acc.navigateTo.push(r.navigateTo)
            }
            return acc
          }, {
            title: [] as string[],
            description: [] as string[],
            technology: [] as string[],
            kind: [] as RelationshipKind[],
            head: [] as RelationshipArrowType[],
            tail: [] as RelationshipArrowType[],
            color: [] as Color[],
            line: [] as RelationshipLineType[],
            navigateTo: [] as ViewID[]
          })
        )
        relation = {
          title: only(allprops.title) ?? '[...]',
          description: only(allprops.description),
          technology: only(allprops.technology),
          kind: only(allprops.kind),
          head: only(allprops.head),
          tail: only(allprops.tail),
          color: only(allprops.color),
          line: only(allprops.line),
          navigateTo: only(allprops.navigateTo)
        }
      }

      const tags = uniqueTags(relations)

      return Object.assign(
        edge,
        this.getEdgeLabel(relation),
        isTruthy(relation.description) && { description: relation.description },
        isTruthy(relation.technology) && { technology: relation.technology },
        isTruthy(relation.kind) && { kind: relation.kind },
        relation.color && { color: relation.color },
        relation.line && { line: relation.line },
        relation.head && { head: relation.head },
        relation.tail && { tail: relation.tail },
        relation.navigateTo && { navigateTo: relation.navigateTo },
        tags && { tags }
      )
    })
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
    return this.explicits.has(el.id)
  }

  public isImplicit(el: DeploymentElement): boolean {
    return this.hasElement(el) && !this.isExplicit(el)
  }

  public hasElement(el: DeploymentElement): boolean {
    return this.explicits.has(el.id) || this.implicits.has(el.id)
      || this.edges.some(e => e.source.id === el.id || e.target.id === el.id)
  }

  public get includedElements() {
    return new Set([
      ...this.explicits.values(),
      ...this.edges.flatMap(e => [e.source, e.target])
    ]) as ReadonlySet<DeploymentElement>
  }

  public get resolvedElements() {
    return new Set([
      ...this.explicits.values(),
      ...this.implicits.values(),
      ...this.edges.flatMap(e => [e.source, e.target])
    ]) as ReadonlySet<DeploymentElement>
  }

  // public includedA(el: DeploymentElement) {
  //   this.graph.ascendingSiblings(el).filter()
  // }

  public addElement(...elements: DeploymentElement[]): void {
    for (const el of elements) {
      this.explicits.set(el.id, el)
      this.implicits.delete(el.id)
    }
  }

  public addImplicit(...elements: DeploymentElement[]): void {
    for (const el of elements) {
      this.implicits.set(el.id, el)
    }
  }

  public excludeElement(...elements: DeploymentElement[]): void {
    const excluded = new Set<Fqn>()
    for (const el of elements) {
      this.explicits.delete(el.id)
      this.implicits.delete(el.id)
      excluded.add(el.id)
    }
    this.edges = this.edges.filter(e => !excluded.has(e.source.id) && !excluded.has(e.target.id))
  }

  public addEdges(edges: Edges) {
    const added = [] as DeploymentEdge[]
    for (const e of edges) {
      if (e.relations.size === 0) {
        continue
      }
      const existing = this.edges.find(
        _e => _e.source.id === e.source.id && _e.target.id === e.target.id
      )
      if (existing) {
        for (const rel of e.relations) {
          existing.relations.add(rel)
        }
        added.push(existing)
        continue
      }
      added.push(e)
      this.edges.push(e)
    }
    return added
  }

  public reset(): void {
    this.edges = []
    this.explicits.clear()
    this.implicits.clear()
  }

  public *ancestors(fqn: Fqn) {
    for (const anc of ancestorsFqn(fqn)) {
      const el = this.explicits.get(anc) || this.implicits.get(anc)
      if (el) {
        yield el
      }
    }
  }

  private removeRedundantImplicitEdges() {
    // copy edges to avoid mutationq
    const alledges = this.edges.map(({ relations, ...e }) => {
      return {
        relations: new Set(relations),
        ...e
      }
    })
    this.edges = this.edges.filter(({ source, target, relations }) => {
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
