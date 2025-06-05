import { indexBy, isString, map, prop } from 'remeda'
import { LikeC4Model } from '../../../model'
import {
  type Aux,
  type aux,
  type BorderStyle,
  type Color,
  type ComputedElementView,
  type Element,
  type ElementShape,
  type ElementViewPredicate,
  type ElementViewPredicate as ViewRulePredicate,
  type ElementViewRule,
  type ElementViewRule as ViewRule,
  type ElementViewRuleGroup as ViewRuleGroup,
  type ElementViewRuleStyle as ViewRuleStyle,
  type Fqn,
  type GlobalPredicateId,
  type GlobalStyleID,
  type IconUrl,
  type KindEqual,
  type ModelExpression,
  type ModelRelation,
  type NonEmptyArray,
  type ParsedElementView,
  type RelationId,
  type RelationshipArrowType,
  type RelationshipLineType,
  type scalar,
  type SpecAux,
  type TagEqual,
  type ViewRuleGlobalPredicateRef,
  type ViewRuleGlobalStyle,
  type WhereOperator,
  ModelFqnExpr,
  ModelRelationExpr,
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
  id: id as scalar.Fqn,
  kind: kind as scalar.ElementKind,
  title: title ?? id,
  description: null,
  technology: null,
  tags: tags as NonEmptyArray<scalar.Tag> ?? null,
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
    source: {
      model: source as Fqn,
    },
    target: {
      model: target as Fqn,
    },
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
      elementTag: 'old',
      isEqual: true,
    })],
    style: {
      color: 'muted',
    },
  }],
  'red_next': [{
    targets: [$expr({
      elementTag: 'next',
      isEqual: true,
    })],
    style: {
      color: 'red',
    },
  }],
} as const

export type FakeRelationIds = (typeof fakeRelations)[number]['id']
const fakeParsedModel = {
  _stage: 'computed' as const,
  specification: {
    elements: {
      actor: {},
      system: {},
      container: {},
      component: {},
    },
    relationships: {
      graphlql: {},
    },
    deployments: {},
    tags: {
      old: {},
      next: {},
      aws: {},
      storage: {},
      communication: {},
      legacy: {},
    },
  },
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

// export type $Aux = typeof fakeModel.Aux
export type $Aux = Aux<
  'computed',
  FakeElementIds,
  never,
  'index',
  never,
  SpecAux<
    'actor' | 'system' | 'container' | 'component',
    never,
    'graphlql',
    TestTag,
    never
  >
>

const emptyView = {
  _stage: 'parsed' as const,
  _type: 'element' as const,
  id: 'index' as scalar.ViewId<'index'>,
  title: null,
  description: null,
  tags: null,
  links: null,
  rules: [],
} satisfies ParsedElementView<$Aux>

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
  props: Omit<ModelFqnExpr.Custom<$Aux>['custom'], 'expr'>,
): ModelFqnExpr.Custom<$Aux> {
  return {
    custom: {
      expr: $expr(expr) as any,
      ...props as any,
    },
  }
}

export function $customRelation(
  relation: ModelRelationExpr.OrWhere<$Aux>,
  props: Omit<ModelRelationExpr.Custom<$Aux>['customRelation'], 'expr'>,
): ModelRelationExpr.Custom<$Aux> {
  return {
    customRelation: {
      expr: $expr(relation) as any,
      ...props,
    },
  }
}

export function $where(
  expr: Expression,
  operator: WhereOperator<$Aux>,
): ModelExpression.Where<$Aux>
export function $where(
  expr: ModelRelationExpr<$Aux>,
  operator: WhereOperator<$Aux>,
): ModelRelationExpr.Where<$Aux>
export function $where(
  expr: ModelFqnExpr<$Aux>,
  operator: WhereOperator<$Aux>,
): ModelFqnExpr.Where<$Aux>
export function $where(
  expr: Expression | ModelExpression<$Aux>,
  operator: WhereOperator<$Aux>,
): ModelExpression.Where<$Aux> {
  return {
    where: {
      expr: $expr(expr) as any,
      condition: operator,
    },
  }
}

export function $participant(
  participant: Participant,
  operator: TagEqual<$Aux> | KindEqual<$Aux>,
): WhereOperator<$Aux> {
  return {
    participant,
    operator,
  }
}

export function $inout(
  expr: InOutExpr | ModelFqnExpr<$Aux>,
): ModelRelationExpr.InOut<$Aux> {
  const innerExpression = !isString(expr)
    ? expr
    : $expr(expr.replace(/->/g, '').trim() as any)

  return { inout: innerExpression as any }
}

export function $incoming(
  expr: IncomingExpr | ModelFqnExpr<$Aux>,
): ModelRelationExpr.Incoming<$Aux> {
  const innerExpression = !isString(expr)
    ? expr
    : $expr(expr.replace('-> ', '') as any)

  return { incoming: innerExpression as any }
}

export function $outgoing(
  expr: OutgoingExpr | ModelFqnExpr<$Aux>,
): ModelRelationExpr.Outgoing<$Aux> {
  const innerExpression = !isString(expr)
    ? expr as ModelFqnExpr
    : $expr(expr.replace(' ->', '') as any)

  return { outgoing: innerExpression as any }
}

export function $relation(
  expr: RelationExpr,
): ModelRelationExpr.Direct<$Aux> {
  const [source, target] = expr.split(/ -> | <-> /)
  const isBidirectional = expr.includes(' <-> ')

  return {
    source: $expr(source as ElementRefExpr) as any,
    target: $expr(target as ElementRefExpr) as any,
    ...(isBidirectional && { isBidirectional }),
  }
}

export function $expr(expr: Expression | ModelExpression<$Aux>): ModelExpression<$Aux> {
  if (!isString(expr)) {
    return expr as ModelExpression<$Aux>
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
        model: expr.replace('._', '') as aux.Fqn<$Aux>,
      },
      selector: 'expanded',
    }
  }
  if (expr.endsWith('.*')) {
    return {
      ref: {
        model: expr.replace('.*', '') as aux.Fqn<$Aux>,
      },
      selector: 'children',
    }
  }
  if (expr.endsWith('.**')) {
    return {
      ref: {
        model: expr.replace('.**', '') as aux.Fqn<$Aux>,
      },
      selector: 'descendants',
    }
  }
  return {
    ref: {
      model: expr as aux.Fqn<$Aux>,
    },
  }
}

type CustomProps = {
  where?: WhereOperator<$Aux>
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
  } & Omit<ModelRelationExpr.Custom<$Aux>['customRelation'], 'expr' | 'navigateTo'>
}
export function $include(
  expr: Expression | ModelExpression<$Aux>,
  props?: CustomProps,
): ElementViewPredicate<$Aux> {
  let _expr = props?.where ? $where(expr as any, props.where as any) : $expr(expr)
  _expr = props?.with ? $with(_expr, props.with) : _expr
  return {
    include: [_expr],
  }
}
export function $with(
  expr: ModelExpression<$Aux>,
  props?: CustomProps['with'],
): ModelRelationExpr.Custom<$Aux> | ModelFqnExpr.Custom<$Aux> {
  if (ModelRelationExpr.is(expr) || ModelRelationExpr.isWhere(expr)) {
    return {
      customRelation: {
        expr,
        ...props as any,
      },
    }
  } else if (ModelFqnExpr.is(expr) || ModelFqnExpr.isWhere(expr)) {
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
  expr: Expression | ModelExpression<$Aux>,
  where?: WhereOperator<$Aux>,
): ViewRulePredicate<$Aux> {
  let _expr = where ? $where(expr as any, where) : $expr(expr)
  return {
    exclude: [_expr],
  }
}
export function $group(groupRules: ViewRuleGroup<$Aux>['groupRules']): ViewRuleGroup<$Aux> {
  return {
    title: null,
    groupRules,
  }
}

export function $style(element: ElementRefExpr, style: ViewRuleStyle<$Aux>['style']): ViewRuleStyle<$Aux> {
  return {
    targets: [$expr(element) as ModelFqnExpr<$Aux>],
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
  ...args: [FakeElementIds, ElementViewRule<$Aux> | ElementViewRule<$Aux>[]] | [
    ElementViewRule<$Aux> | ElementViewRule<$Aux>[],
  ]
): ComputedElementView<$Aux> & {
  nodeIds: string[]
  edgeIds: string[]
} {
  let result: ComputedElementView<$Aux>
  if (args.length === 1) {
    result = computeElementView<$Aux>(
      fakeModel as unknown as LikeC4Model<$Aux>,
      {
        ...emptyView,
        rules: [args[0]].flat() as ElementViewRule<$Aux>[],
      },
    )
  } else {
    result = computeElementView(
      fakeModel as unknown as LikeC4Model<$Aux>,
      {
        ...emptyView,
        viewOf: args[0] as aux.Fqn<$Aux>,
        rules: [args[1]].flat() as ElementViewRule<$Aux>[],
      },
    )
  }

  result = withReadableEdges(result)

  return Object.assign(result, {
    nodeIds: map(result.nodes, prop('id')) as string[],
    edgeIds: map(result.edges, prop('id')) as string[],
  })
}
