import { indexBy, values } from 'remeda'
import type {
  ComputedView,
  Element,
  ElementKind,
  Expression as C4Expression,
  Fqn,
  Relation,
  RelationID,
  Tag,
  ViewID,
  ViewRule,
  ViewRuleExpression
} from '@likec4/core'
import { LikeC4ModelGraph } from '../../LikeC4ModelGraph'
import { computeElementView } from '../index'
import { pluck } from 'rambdax'

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
const el = ({
  id,
  kind,
  title,
  ...props
}: Partial<Omit<Element, 'id' | 'kind'>> & { id: string; kind: string }): Element => ({
  id: id as Fqn,
  kind: kind as ElementKind,
  title: title ?? id,
  description: null,
  technology: null,
  tags: null,
  links: null,
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
    title: 'cloud'
  }),
  'amazon': el({
    id: 'amazon',
    kind: 'system',
    title: 'amazon'
  }),
  'amazon.s3': el({
    id: 'amazon.s3',
    kind: 'component',
    title: 's3',
    shape: 'storage'
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
    title: 'graphql'
  }),
  'cloud.backend.storage': el({
    id: 'cloud.backend.storage',
    kind: 'component',
    title: 'storage',
    tags: ['old' as Tag]
  }),
  'cloud.frontend.adminPanel': el({
    id: 'cloud.frontend.adminPanel',
    kind: 'component',
    title: 'adminPanel',
    tags: ['old' as Tag]
  }),
  'cloud.frontend.dashboard': el({
    id: 'cloud.frontend.dashboard',
    kind: 'component',
    title: 'dashboard'
  })
} satisfies Record<string, Element>

export type FakeElementIds = keyof typeof fakeElements

const rel = ({
  source,
  target,
  title
}: {
  source: FakeElementIds
  target: FakeElementIds
  title?: string
}): Relation => ({
  id: `${source}:${target}` as RelationID,
  title: title ?? '',
  source: source as Fqn,
  target: target as Fqn
})

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
    title: 'uploads'
  }),
  rel({
    source: 'cloud.backend.graphql',
    target: 'cloud.backend.storage',
    title: 'stores'
  }),
  rel({
    source: 'cloud.frontend.dashboard',
    target: 'cloud.backend.graphql',
    title: 'requests'
  }),
  rel({
    source: 'cloud.frontend.adminPanel',
    target: 'cloud.backend.graphql',
    title: 'fetches'
  })
]

export type FakeRelationIds = keyof typeof fakeRelations

export const fakeModel = new LikeC4ModelGraph({
  elements: fakeElements,
  relations: indexBy(fakeRelations, r => r.id)
})

const emptyView = {
  id: 'index' as ViewID,
  title: null,
  description: null,
  tags: null,
  links: null,
  rules: []
}

export const includeWildcard = {
  include: [
    {
      wildcard: true
    }
  ]
} satisfies ViewRule

export type ElementRefExpr = '*' | FakeElementIds | `${FakeElementIds}.*`

type InOutExpr = `-> ${ElementRefExpr} ->`
type IncomingExpr = `-> ${ElementRefExpr}`
type OutgoingExpr = `${ElementRefExpr} ->`
type RelationExpr = `${ElementRefExpr} -> ${ElementRefExpr}`

type Expression = ElementRefExpr | InOutExpr | IncomingExpr | OutgoingExpr | RelationExpr

function toExpression(expr: Expression): C4Expression {
  if (expr === '*') {
    return { wildcard: true }
  }
  if (expr.startsWith('->')) {
    if (expr.endsWith('->')) {
      return {
        inout: toExpression(expr.replace(/->/g, '').trim() as ElementRefExpr) as any
      }
    }
    return {
      incoming: toExpression(expr.replace('-> ', '') as ElementRefExpr) as any
    }
  }
  if (expr.endsWith(' ->')) {
    return {
      outgoing: toExpression(expr.replace(' ->', '') as ElementRefExpr) as any
    }
  }
  if (expr.includes(' -> ')) {
    const [source, target] = expr.split(' -> ')
    return {
      source: toExpression(source as ElementRefExpr) as any,
      target: toExpression(target as ElementRefExpr) as any
    }
  }
  if (expr.endsWith('.*')) {
    return {
      element: expr.replace('.*', '') as Fqn,
      isDescedants: true
    }
  }
  return {
    element: expr as Fqn,
    isDescedants: false
  }
}

export function $include(expr: Expression): ViewRuleExpression {
  return {
    include: [toExpression(expr)]
  }
}
export function $exclude(expr: Expression): ViewRuleExpression {
  return {
    exclude: [toExpression(expr)]
  }
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
        id: 'index' as ViewID,
        viewOf: args[0] as Fqn,
        rules: [args[1]].flat()
      },
      fakeModel
    )
  }
  return Object.assign(result, {
    nodeIds: pluck('id', result.nodes) as string[],
    edgeIds: pluck('id', result.edges) as string[]
  })
}
