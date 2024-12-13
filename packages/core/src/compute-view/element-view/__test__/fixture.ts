import { forEach, indexBy, isString, map, mapToObj, prop, values } from 'remeda'
import {
  type BorderStyle,
  type Color,
  type ComputedView,
  type CustomElementExpr as C4CustomElementExpr,
  type CustomRelationExpr as C4CustomRelationExpr,
  type EdgeId,
  type Element,
  type ElementExpression as C4ElementExpression,
  type ElementKind,
  type ElementShape,
  type ElementView,
  type ElementWhereExpr,
  type Expression as C4Expression,
  type Fqn,
  type GlobalStyleID,
  type IconUrl,
  type IncomingExpr as C4IncomingExpr,
  type InOutExpr as C4InOutExpr,
  isElementRef,
  isElementWhere,
  isRelationExpression,
  isRelationWhere,
  type ModelRelation,
  type NonEmptyArray,
  type OutgoingExpr as C4OutgoingExpr,
  type RelationId,
  type RelationshipArrowType,
  type RelationshipLineType,
  type RelationWhereExpr,
  type Tag,
  type ViewId,
  type ViewRule,
  type ViewRuleGlobalStyle,
  type ViewRuleGroup,
  type ViewRulePredicate,
  type ViewRuleStyle,
  type WhereOperator
} from '../../../types'
import { type RelationExpr_ as C4RelationExpr } from '../../../types/expression'
import { LikeC4ModelGraph } from '../../LikeC4ModelGraph'
import { withReadableEdges } from '../../utils/with-readable-edges'
import { ComputeCtx } from '../compute'

function computeElementView(view: ElementView, graph: LikeC4ModelGraph) {
  return ComputeCtx.elementView(view, graph)
}

/**
              ┌──────────────────────────────────────────────────┐
              │                      cloud                       │
              │  ┌───────────────────────────────────────────┐   │
              │  │                 frontend                  │   │
┏━━━━━━━━━━┓  │  │   ┏━━━━━━━━━━━━━┓   ┏━━━━━━━━━━━━━━━━┓    │   │   ┏━━━━━━━━━━━┓
┃          ┃  │  │   ┃             ┃   ┃                ┃    │   │   ┃           ┃
┃ customer ┃──┼──┼──▶┃  dashboard  ┃   ┃   adminpanel   ┃◀───┼───┼───┃  support  ┃
┃          ┃  │  │   ┃             ┃   ┃                ┃    │   │   ┃           ┃
┗━━━━━━━━━━┛  │  │   ┗━━━━━━┳━━━━━━┛   ┗━━━━━━━━┳━━━━━━━┛    │   │   ┗━━━━━━━━━━━┛
              │  └──────────┼───────────────────┼────────────┘   │
              │             ├───────────────────┘                │
              │             │                                    │
              │  ┌──────────┼────────────────────────────────┐   │
              │  │          ▼       backend                  │   │
              │  │   ┏━━━━━━━━━━━━━┓       ┏━━━━━━━━━━━━━┓   │   │
              │  │   ┃             ┃       ┃             ┃   │   │
              │  │   ┃  graphlql   ┃──────▶┃   storage   ┃   │   │
              │  │   ┃             ┃       ┃             ┃   │   │
              │  │   ┗━━━━━━━━━━━━━┛       ┗━━━━━━┳━━━━━━┛   │   │
              │  └────────────────────────────────┼──────────┘   │
              └───────────────────────────────────┼──────────────┘
                                                  │
                                        ┌─────────┼─────────┐
                                        │ amazon  │         │
                                        │         ▼         │
                                        │ ┏━━━━━━━━━━━━━━┓  │
                                        │ ┃              ┃  │
                                        │ ┃      s3      ┃  │
                                        │ ┃              ┃  │
                                        │ ┗━━━━━━━━━━━━━━┛  │
                                        └───────────────────┘

specification {
  element actor
  element system
  element container
  element component

  tag old
}

model {

  actor customer
  actor support

  system cloud {
    container backend {
      component graphql
      component storage {
        #old
      }

      graphql -> storage
    }

    container frontend {
      component dashboard {
        -> graphql
      }
      component adminPanel {
        #old
        -> graphql
      }
    }
  }

  customer -> dashboard
  support -> adminPanel

  system amazon {
    component s3

    cloud.backend.storage -> s3
  }

}

 */
type TestTag = 'old' | 'next' | 'aws' | 'storage' | 'communication' | 'legacy'

const el = ({
  id,
  kind,
  title,
  style,
  tags,
  ...props
}: Partial<Omit<Element, 'id' | 'kind' | 'tags'>> & {
  id: string
  kind: string
  tags?: NonEmptyArray<TestTag>
}): Element => ({
  id: id as Fqn,
  kind: kind as ElementKind,
  title: title ?? id,
  description: null,
  technology: null,
  tags: tags as NonEmptyArray<Tag> ?? null,
  links: null,
  style: {
    ...style
  },
  ...props
})

export const fakeElements = {
  'customer': el({
    id: 'customer',
    kind: 'actor',
    title: 'customer',
    shape: 'person'
  }),
  'support': el({
    id: 'support',
    kind: 'actor',
    title: 'support',
    shape: 'person'
  }),
  'cloud': el({
    id: 'cloud',
    kind: 'system',
    title: 'cloud',
    icon: 'none',
    tags: ['next', 'old']
  }),
  'cloud.backend': el({
    id: 'cloud.backend',
    kind: 'container',
    title: 'backend'
  }),
  'cloud.frontend': el({
    id: 'cloud.frontend',
    kind: 'container',
    title: 'frontend',
    shape: 'browser'
  }),
  'cloud.backend.graphql': el({
    id: 'cloud.backend.graphql',
    kind: 'component',
    icon: 'tech:graphql' as IconUrl,
    title: 'graphql'
  }),
  'email': el({
    id: 'email',
    kind: 'system',
    title: 'email'
  }),
  'cloud.backend.storage': el({
    id: 'cloud.backend.storage',
    kind: 'component',
    title: 'storage',
    tags: ['storage', 'old']
  }),
  'cloud.frontend.adminPanel': el({
    id: 'cloud.frontend.adminPanel',
    kind: 'component',
    title: 'adminPanel',
    tags: ['old']
  }),
  'cloud.frontend.dashboard': el({
    id: 'cloud.frontend.dashboard',
    kind: 'component',
    title: 'dashboard',
    icon: 'tech:react' as IconUrl,
    tags: ['next']
  }),
  'amazon': el({
    id: 'amazon',
    kind: 'system',
    title: 'amazon',
    icon: 'tech:aws' as IconUrl,
    tags: ['aws']
  }),
  'amazon.s3': el({
    id: 'amazon.s3',
    kind: 'component',
    title: 's3',
    shape: 'storage',
    icon: 'aws:s3' as IconUrl,
    tags: ['aws', 'storage']
  })
} satisfies Record<string, Element>

export type FakeElementIds = keyof typeof fakeElements

const rel = <Source extends FakeElementIds, Target extends FakeElementIds>({
  source,
  target,
  title,
  ...props
}: {
  source: Source
  target: Target
  title?: string
  kind?: string
  color?: Color
  line?: RelationshipLineType
  head?: RelationshipArrowType
  tail?: RelationshipArrowType
  tags?: NonEmptyArray<TestTag>
}) =>
  ({
    id: `${source}:${target}` as RelationId,
    title: title ?? '',
    source: source as Fqn,
    target: target as Fqn,
    ...(props as any)
  }) as Omit<ModelRelation, 'id'> & { id: `${Source}:${Target}` }

export const fakeRelations = [
  rel({
    source: 'customer',
    target: 'cloud.frontend.dashboard',
    title: 'opens in browser'
  }),
  rel({
    source: 'support',
    target: 'cloud.frontend.adminPanel',
    title: 'manages'
  }),
  rel({
    source: 'cloud.backend.storage',
    target: 'amazon.s3',
    title: 'uploads',
    tags: ['aws', 'storage', 'legacy']
  }),
  rel({
    source: 'customer',
    target: 'cloud',
    title: 'uses'
  }),
  rel({
    source: 'cloud.backend.graphql',
    target: 'cloud.backend.storage',
    title: 'stores',
    tags: ['old', 'storage']
  }),
  // rel({
  //   source: 'cloud.backend',
  //   target: 'cloud.email',
  //   title: 'schedule emails'
  // }),
  // rel({
  //   source: 'cloud.email',
  //   target: 'customer',
  //   title: 'send emails'
  // }),
  rel({
    source: 'cloud.frontend',
    target: 'cloud.backend',
    title: 'requests'
  }),
  rel({
    source: 'cloud.frontend.dashboard',
    target: 'cloud.backend.graphql',
    kind: 'graphlql',
    title: 'requests',
    line: 'solid',
    tags: ['next']
  }),
  rel({
    source: 'cloud.frontend.adminPanel',
    target: 'cloud.backend.graphql',
    kind: 'graphlql',
    title: 'fetches',
    line: 'dashed',
    tail: 'odiamond',
    tags: ['old']
  }),
  rel({
    source: 'cloud',
    target: 'amazon',
    title: 'uses',
    head: 'diamond',
    tail: 'odiamond',
    tags: ['aws']
  }),
  rel({
    source: 'cloud.backend',
    target: 'email',
    title: 'schedule',
    tags: ['communication']
  }),
  rel({
    source: 'cloud',
    target: 'email',
    title: 'uses',
    tags: ['communication']
  }),
  rel({
    source: 'email',
    target: 'cloud',
    title: 'notifies',
    tags: ['communication']
  })
]

export const globalStyles = {
  'mute_old': [{
    targets: [$expr({
      elementTag: 'old' as Tag,
      isEqual: true
    })],
    style: {
      color: 'muted'
    }
  }],
  'red_next': [{
    targets: [$expr({
      elementTag: 'next' as Tag,
      isEqual: true
    })],
    style: {
      color: 'red'
    }
  }]
} as const

export type FakeRelationIds = (typeof fakeRelations)[number]['id']

export const fakeModel = new LikeC4ModelGraph({
  elements: fakeElements,
  relations: indexBy(fakeRelations, r => r.id),
  globals: {
    predicates: {},
    dynamicPredicates: {},
    styles: globalStyles
  }
})

const emptyView = {
  __: 'element' as const,
  id: 'index' as ViewId,
  title: null,
  description: null,
  tags: null,
  links: null,
  customColorDefinitions: {},
  rules: []
}

export const includeWildcard = {
  include: [
    {
      wildcard: true
    }
  ]
} satisfies ViewRule

export type ElementRefExpr = '*' | FakeElementIds | `${FakeElementIds}.*` | `${FakeElementIds}._`

type InOutExpr = `-> ${ElementRefExpr} ->`
type IncomingExpr = `-> ${ElementRefExpr}`
type OutgoingExpr = `${ElementRefExpr} ->`
type RelationKeyword = '->' | '<->'
type RelationExpr = `${ElementRefExpr} ${RelationKeyword} ${ElementRefExpr}`

export type Expression =
  | ElementRefExpr
  | InOutExpr
  | IncomingExpr
  | OutgoingExpr
  | RelationExpr

export function $custom(
  expr: ElementRefExpr,
  props: {
    title?: string
    description?: string
    technology?: string
    shape?: ElementShape
    color?: Color
    border?: BorderStyle
    icon?: string
    opacity?: number
    navigateTo?: string
  }
): C4CustomElementExpr {
  return {
    custom: {
      expr: $expr(expr) as any,
      ...props as any
    }
  }
}

export function $customRelation(
  relation: RelationExpr,
  props: Omit<C4CustomRelationExpr['customRelation'], 'relation'>
): C4CustomRelationExpr {
  return {
    customRelation: {
      relation: $expr(relation) as any,
      ...props
    }
  }
}

export function $where(
  expr: Expression | C4Expression,
  operator: WhereOperator<TestTag, string>
): ElementWhereExpr | RelationWhereExpr {
  return {
    where: {
      expr: $expr(expr) as any,
      condition: operator
    }
  }
}

export function $inout(
  expr: InOutExpr | C4ElementExpression
): C4InOutExpr {
  const innerExpression = !isString(expr)
    ? expr as C4Expression
    : $expr(expr.replace(/->/g, '').trim() as ElementRefExpr) as any

  return { inout: innerExpression }
}

export function $incoming(
  expr: IncomingExpr | C4ElementExpression
): C4IncomingExpr {
  const innerExpression = !isString(expr)
    ? expr as C4Expression
    : $expr(expr.replace('-> ', '') as ElementRefExpr) as any

  return { incoming: innerExpression }
}

export function $outgoing(
  expr: OutgoingExpr | C4ElementExpression
): C4OutgoingExpr {
  const innerExpression = !isString(expr)
    ? expr as C4Expression
    : $expr(expr.replace(' ->', '') as ElementRefExpr) as any

  return { outgoing: innerExpression }
}

export function $relation(
  expr: RelationExpr
): C4RelationExpr {
  const [source, target] = expr.split(/ -> | <-> /)
  const isBidirectional = expr.includes(' <-> ')

  return {
    source: $expr(source as ElementRefExpr) as any,
    target: $expr(target as ElementRefExpr) as any,
    ...(isBidirectional && { isBidirectional })
  }
}

export function $expr(expr: Expression | C4Expression): C4Expression {
  if (!isString(expr)) {
    return expr as C4Expression
  }
  if (expr === '*') {
    return { wildcard: true }
  }
  if (expr.startsWith('->')) {
    return expr.endsWith('->') ? $inout(expr as InOutExpr) : $incoming(expr as IncomingExpr)
  }
  if (expr.endsWith(' ->')) {
    return $outgoing(expr as OutgoingExpr)
  }
  if (expr.includes(' -> ') || expr.includes(' <-> ')) {
    return $relation(expr as RelationExpr)
  }
  if (expr.endsWith('._')) {
    return {
      expanded: expr.replace('._', '') as Fqn
    }
  }
  if (expr.endsWith('.*')) {
    return {
      element: expr.replace('.*', '') as Fqn,
      isChildren: true
    }
  }
  if (expr.endsWith('.**')) {
    return {
      element: expr.replace('.*', '') as Fqn,
      isDescendants: true
    }
  }
  return {
    element: expr as Fqn
  }
}

type CustomProps = {
  where?: WhereOperator<TestTag, string>
  with?: {
    title?: string
    description?: string
    technology?: string
    shape?: ElementShape
    color?: Color
    border?: BorderStyle
    icon?: string
    opacity?: number
    navigateTo?: string
  } & Omit<C4CustomRelationExpr['customRelation'], 'relation' | 'navigateTo'>
}
export function $include(expr: Expression | C4Expression, props?: CustomProps): ViewRulePredicate {
  let _expr = props?.where ? $where(expr, props.where) : $expr(expr)
  _expr = props?.with ? $with(_expr, props.with) : _expr
  return {
    include: [_expr]
  }
}
export function $with(expr: C4Expression, props?: CustomProps['with']): C4CustomRelationExpr | C4CustomElementExpr {
  if (isRelationExpression(expr) || isRelationWhere(expr)) {
    return {
      customRelation: {
        relation: expr,
        ...props as any
      }
    }
  } else if (isElementRef(expr) || isElementWhere(expr)) {
    return {
      custom: {
        expr: expr,
        ...props as any
      }
    }
  }

  throw 'Unsupported type of internal expression'
}
export function $exclude(expr: Expression | C4Expression, where?: WhereOperator<TestTag, string>): ViewRulePredicate {
  let _expr = where ? $where(expr, where) : $expr(expr)
  return {
    exclude: [_expr]
  }
}
export function $group(groupRules: ViewRuleGroup['groupRules']): ViewRuleGroup {
  return {
    title: null,
    groupRules
  }
}

export function $style(element: ElementRefExpr, style: ViewRuleStyle['style']): ViewRuleStyle {
  return {
    targets: [$expr(element) as C4ElementExpression],
    style: Object.assign({}, style)
  }
}

type GlobalStyles = keyof typeof globalStyles
type GlobalExpr = `style ${GlobalStyles}`
export function $global(expr: GlobalExpr): ViewRuleGlobalStyle {
  const [_t, id] = expr.split(' ') as [string, string]
  if (_t === 'style') {
    return {
      styleId: id as GlobalStyleID
    }
  }
  throw new Error('Invalid global expression')
}

export function computeView(
  ...args: [FakeElementIds, ViewRule | ViewRule[]] | [ViewRule | ViewRule[]]
) {
  let result: ComputedView
  if (args.length === 1) {
    result = computeElementView(
      {
        ...emptyView,
        rules: [args[0]].flat()
      },
      fakeModel
    )
  } else {
    result = computeElementView(
      {
        ...emptyView,
        id: 'index' as ViewId,
        viewOf: args[0] as Fqn,
        rules: [args[1]].flat()
      },
      fakeModel
    )
  }

  result = withReadableEdges(result)

  return Object.assign(result, {
    nodeIds: map(result.nodes, prop('id')) as string[],
    edgeIds: map(result.edges, prop('id')) as string[]
  })
}
