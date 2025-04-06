import { indexBy, isString, map, prop } from 'remeda'
import { LikeC4Model } from '../../../model'
import {
  type BorderStyle,
  type Color,
  type ComputedView,
  type Element,
  type ElementKind,
  type ElementShape,
  type Fqn,
  type GlobalPredicateId,
  type GlobalStyleID,
  type IconUrl,
  type KindEqual,
  type ModelRelation,
  type NonEmptyArray,
  type RelationId,
  type RelationshipArrowType,
  type RelationshipLineType,
  type Tag,
  type TagEqual,
  type ViewId,
  type ViewRule,
  type ViewRuleGlobalPredicateRef,
  type ViewRuleGlobalStyle,
  type ViewRuleGroup,
  type ViewRulePredicate,
  type ViewRuleStyle,
  type WhereOperator,
  ModelLayer,
} from '../../../types'
import type { Participant } from '../../../types/operators'
import { withReadableEdges } from '../../utils/with-readable-edges'
import { computeElementView } from '../compute'

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
    ...style,
  },
  ...props,
})

export const fakeElements = {
  'customer': el({
    id: 'customer',
    kind: 'actor',
    title: 'customer',
    shape: 'person',
  }),
  'support': el({
    id: 'support',
    kind: 'actor',
    title: 'support',
    shape: 'person',
  }),
  'cloud': el({
    id: 'cloud',
    kind: 'system',
    title: 'cloud',
    icon: 'none',
    tags: ['next', 'old'],
  }),
  'cloud.backend': el({
    id: 'cloud.backend',
    kind: 'container',
    title: 'backend',
  }),
  'cloud.frontend': el({
    id: 'cloud.frontend',
    kind: 'container',
    title: 'frontend',
    shape: 'browser',
  }),
  'cloud.backend.graphql': el({
    id: 'cloud.backend.graphql',
    kind: 'component',
    icon: 'tech:graphql' as IconUrl,
    title: 'graphql',
  }),
  'email': el({
    id: 'email',
    kind: 'system',
    title: 'email',
  }),
  'cloud.backend.storage': el({
    id: 'cloud.backend.storage',
    kind: 'component',
    title: 'storage',
    tags: ['storage', 'old'],
  }),
  'cloud.frontend.dashboard': el({
    id: 'cloud.frontend.dashboard',
    kind: 'component',
    title: 'dashboard',
    icon: 'tech:react' as IconUrl,
    tags: ['next'],
  }),
  'cloud.frontend.supportPanel': el({
    id: 'cloud.frontend.supportPanel',
    kind: 'component',
    title: 'adminPanel',
    tags: ['old'],
  }),
  'amazon': el({
    id: 'amazon',
    kind: 'system',
    title: 'amazon',
    icon: 'tech:aws' as IconUrl,
    tags: ['aws'],
  }),
  'amazon.s3': el({
    id: 'amazon.s3',
    kind: 'component',
    title: 's3',
    shape: 'storage',
    icon: 'aws:s3' as IconUrl,
    tags: ['aws', 'storage'],
  }),
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
    ...(props as any),
  }) as Omit<ModelRelation, 'id'> & { id: `${Source}:${Target}` }

export const fakeRelations = [
  rel({
    source: 'customer',
    target: 'cloud.frontend.dashboard',
    title: 'opens in browser',
  }),
  rel({
    source: 'support',
    target: 'cloud.frontend.supportPanel',
    title: 'manages',
  }),
  rel({
    source: 'cloud.backend.storage',
    target: 'amazon.s3',
    title: 'uploads',
    tags: ['aws', 'storage', 'legacy'],
  }),
  rel({
    source: 'customer',
    target: 'cloud',
    title: 'uses',
  }),
  rel({
    source: 'cloud.backend.graphql',
    target: 'cloud.backend.storage',
    title: 'stores',
    tags: ['old', 'storage'],
  }),
  rel({
    source: 'cloud.frontend',
    target: 'cloud.backend',
    title: 'requests',
  }),
  rel({
    source: 'cloud.frontend.dashboard',
    target: 'cloud.backend.graphql',
    kind: 'graphlql',
    title: 'requests',
    line: 'solid',
    tags: ['next'],
  }),
  rel({
    source: 'cloud.frontend.supportPanel',
    target: 'cloud.backend.graphql',
    kind: 'graphlql',
    title: 'fetches',
    line: 'dashed',
    tail: 'odiamond',
    tags: ['old'],
  }),
  rel({
    source: 'cloud',
    target: 'amazon',
    title: 'uses',
    head: 'diamond',
    tail: 'odiamond',
    tags: ['aws'],
  }),
  rel({
    source: 'cloud.backend',
    target: 'email',
    title: 'schedule',
    tags: ['communication'],
  }),
  rel({
    source: 'cloud',
    target: 'email',
    title: 'uses',
    tags: ['communication'],
  }),
  rel({
    source: 'email',
    target: 'cloud',
    title: 'notifies',
    tags: ['communication'],
  }),
]

export const globalStyles = {
  'mute_old': [{
    targets: [$expr({
      elementTag: 'old' as Tag,
      isEqual: true,
    })],
    style: {
      color: 'muted',
    },
  }],
  'red_next': [{
    targets: [$expr({
      elementTag: 'next' as Tag,
      isEqual: true,
    })],
    style: {
      color: 'red',
    },
  }],
} as const

export type FakeRelationIds = (typeof fakeRelations)[number]['id']
const fakeParsedModel = {
  elements: fakeElements,
  relations: indexBy(fakeRelations, r => r.id),
  deployments: {
    elements: {},
    relations: {},
  },
  views: {},
  imports: {},
  globals: {
    predicates: {
      'remove_tag_old': [
        $exclude('*', {
          tag: { eq: 'old' },
        }),
      ],
      'remove_not_tag_old': [
        $exclude('*', {
          tag: { neq: 'old' },
        }),
      ],
      'include_next': [
        $include('* -> *', {
          where: {
            and: [
              {
                or: [
                  { tag: { eq: 'communication' } },
                  { tag: { eq: 'next' } },
                  { tag: { eq: 'old' } },
                ],
              },
              { tag: { neq: 'storage' } },
            ],
          },
        }),
      ],
    } satisfies Record<string, NonEmptyArray<ViewRulePredicate>>,
    dynamicPredicates: {},
    styles: globalStyles,
  },
} as const
export const fakeModel = LikeC4Model.fromDump(fakeParsedModel)

const emptyView = {
  __: 'element' as const,
  id: 'index' as ViewId,
  title: null,
  description: null,
  tags: null,
  links: null,
  customColorDefinitions: {},
  rules: [],
}

export const includeWildcard = {
  include: [
    {
      wildcard: true,
    },
  ],
} satisfies ViewRule

export type ElementRefExpr =
  | '*'
  | FakeElementIds
  | `${FakeElementIds}.*`
  | `${FakeElementIds}.**`
  | `${FakeElementIds}._`

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
  props: Omit<ModelLayer.FqnExpr.Custom['custom'], 'expr'>,
): ModelLayer.FqnExpr.Custom {
  return {
    custom: {
      expr: $expr(expr) as any,
      ...props as any,
    },
  }
}

export function $customRelation(
  relation: ModelLayer.RelationExprOrWhere,
  props: Omit<ModelLayer.RelationExpr.Custom['customRelation'], 'expr'>,
): ModelLayer.RelationExpr.Custom {
  return {
    customRelation: {
      expr: $expr(relation) as any,
      ...props,
    },
  }
}

export function $where(
  expr: Expression,
  operator: WhereOperator<TestTag, string>,
): ModelLayer.Expression.Where
export function $where(
  expr: ModelLayer.RelationExpr,
  operator: WhereOperator<TestTag, string>,
): ModelLayer.RelationExpr.Where
export function $where(
  expr: ModelLayer.FqnExpr,
  operator: WhereOperator<TestTag, string>,
): ModelLayer.FqnExpr.Where
export function $where(
  expr: Expression | ModelLayer.Expression,
  operator: WhereOperator<TestTag, string>,
): ModelLayer.Expression {
  return {
    where: {
      expr: $expr(expr) as any,
      condition: operator,
    },
  }
}

export function $participant(
  participant: Participant,
  operator: TagEqual<TestTag> | KindEqual<TestTag>,
): WhereOperator<TestTag, string> {
  return {
    participant,
    operator,
  }
}

export function $inout(
  expr: InOutExpr | ModelLayer.FqnExpr,
): ModelLayer.RelationExpr.InOut {
  const innerExpression = !isString(expr)
    ? expr as ModelLayer.FqnExpr
    : $expr(expr.replace(/->/g, '').trim() as any)

  return { inout: innerExpression }
}

export function $incoming(
  expr: IncomingExpr | ModelLayer.FqnExpr,
): ModelLayer.RelationExpr.Incoming {
  const innerExpression = !isString(expr)
    ? expr as ModelLayer.FqnExpr
    : $expr(expr.replace('-> ', '') as any)

  return { incoming: innerExpression }
}

export function $outgoing(
  expr: OutgoingExpr | ModelLayer.FqnExpr,
): ModelLayer.RelationExpr.Outgoing {
  const innerExpression = !isString(expr)
    ? expr as ModelLayer.FqnExpr
    : $expr(expr.replace(' ->', '') as any)

  return { outgoing: innerExpression }
}

export function $relation(
  expr: RelationExpr,
): ModelLayer.RelationExpr {
  const [source, target] = expr.split(/ -> | <-> /)
  const isBidirectional = expr.includes(' <-> ')

  return {
    source: $expr(source as ElementRefExpr) as any,
    target: $expr(target as ElementRefExpr) as any,
    ...(isBidirectional && { isBidirectional }),
  }
}

export function $expr(expr: Expression | ModelLayer.Expression): ModelLayer.Expression {
  if (!isString(expr)) {
    return expr as ModelLayer.Expression
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
      ref: {
        model: expr.replace('._', '') as Fqn,
      },
      selector: 'expanded',
    }
  }
  if (expr.endsWith('.*')) {
    return {
      ref: {
        model: expr.replace('.*', '') as Fqn,
      },
      selector: 'children',
    }
  }
  if (expr.endsWith('.**')) {
    return {
      ref: {
        model: expr.replace('.**', '') as Fqn,
      },
      selector: 'descendants',
    }
  }
  return {
    ref: {
      model: expr as Fqn,
    },
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
    multiple?: boolean
  } & Omit<ModelLayer.RelationExpr.Custom['customRelation'], 'expr' | 'navigateTo'>
}
export function $include(
  expr: Expression | ModelLayer.Expression,
  props?: CustomProps,
): ViewRulePredicate {
  let _expr = props?.where ? $where(expr as any, props.where) : $expr(expr)
  _expr = props?.with ? $with(_expr, props.with) : _expr
  return {
    include: [_expr],
  }
}
export function $with(
  expr: ModelLayer.Expression,
  props?: CustomProps['with'],
): ModelLayer.RelationExpr.Custom | ModelLayer.FqnExpr.Custom {
  if (ModelLayer.RelationExpr.is(expr) || ModelLayer.RelationExpr.isWhere(expr)) {
    return {
      customRelation: {
        expr,
        ...props as any,
      },
    }
  } else if (ModelLayer.FqnExpr.is(expr) || ModelLayer.FqnExpr.isWhere(expr)) {
    return {
      custom: {
        expr,
        ...props as any,
      },
    }
  }

  throw 'Unsupported type of internal expression'
}
export function $exclude(
  expr: Expression | ModelLayer.Expression,
  where?: WhereOperator<TestTag, string>,
): ViewRulePredicate {
  let _expr = where ? $where(expr as any, where) : $expr(expr)
  return {
    exclude: [_expr],
  }
}
export function $group(groupRules: ViewRuleGroup['groupRules']): ViewRuleGroup {
  return {
    title: null,
    groupRules,
  }
}

export function $style(element: ElementRefExpr, style: ViewRuleStyle['style']): ViewRuleStyle {
  return {
    targets: [$expr(element) as ModelLayer.FqnExpr],
    style: Object.assign({}, style),
  }
}

type GlobalStyles = `style ${keyof typeof globalStyles}`
type GlobalPredicate = `predicate ${keyof typeof fakeParsedModel.globals.predicates}`
type GlobalExpr = GlobalStyles | GlobalPredicate
export function $global(expr: GlobalExpr): ViewRuleGlobalStyle | ViewRuleGlobalPredicateRef {
  const [_t, id] = expr.split(' ') as [string, string]
  switch (_t) {
    case 'predicate':
      return {
        predicateId: id as GlobalPredicateId,
      }
    case 'style':
      return {
        styleId: id as GlobalStyleID,
      }
    default:
      throw new Error(`Invalid global expression: ${expr}`)
  }
}

export function computeView(
  ...args: [FakeElementIds, ViewRule | ViewRule[]] | [ViewRule | ViewRule[]]
) {
  let result: ComputedView
  if (args.length === 1) {
    result = computeElementView(
      fakeModel,
      {
        ...emptyView,
        rules: [args[0]].flat(),
      },
    )
  } else {
    result = computeElementView(
      fakeModel,
      {
        ...emptyView,
        id: 'index' as ViewId,
        viewOf: args[0] as Fqn,
        rules: [args[1]].flat(),
      },
    )
  }

  result = withReadableEdges(result)

  return Object.assign(result, {
    nodeIds: map(result.nodes, prop('id')) as string[],
    edgeIds: map(result.edges, prop('id')) as string[],
  })
}
