import { mapToObj } from 'remeda'
import type { LiteralUnion, Tagged, UnwrapTagged } from 'type-fest'
import {
  type ComputedLikeC4Model,
  type Element,
  type ElementKindSpecification,
  type NonEmptyArray,
  type Relation,
  type RelationshipArrowType,
  type RelationshipLineType,
  type Tag,
  type ThemeColor
} from '../../types'

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

const el = <Id extends string, Kind extends string>({
  id,
  kind,
  title,
  style,
  tags,
  ...props
}: Partial<Omit<Element, 'id' | 'kind' | 'tags'>> & {
  id: Id
  kind: Kind
  tags?: NonEmptyArray<TestTag>
}) =>
  ({
    id: id as Tagged<Id, 'Fqn'>,
    kind: kind as Tagged<Kind, 'ElementKind'>,
    title: title ?? id,
    description: null,
    technology: null,
    tags: tags as NonEmptyArray<Tag> ?? null,
    links: null,
    style: {
      ...style
    },
    ...props
  }) satisfies Element

const fakeElementsArr = [
  el({
    id: 'customer',
    kind: 'actor',
    title: 'customer',
    shape: 'person'
  }),
  el({
    id: 'support',
    kind: 'actor',
    title: 'support',
    shape: 'person'
  }),
  el({
    id: 'cloud',
    kind: 'system',
    title: 'cloud',
    tags: ['next', 'old']
  }),
  el({
    id: 'cloud.backend',
    kind: 'container',
    title: 'backend'
  }),
  el({
    id: 'cloud.frontend',
    kind: 'container',
    title: 'frontend',
    shape: 'browser'
  }),
  el({
    id: 'cloud.backend.graphql',
    kind: 'component',
    title: 'graphql'
  }),
  el({
    id: 'email',
    kind: 'system',
    title: 'email'
  }),
  el({
    id: 'cloud.backend.storage',
    kind: 'component',
    title: 'storage',
    tags: ['storage', 'old']
  }),
  el({
    id: 'cloud.frontend.adminPanel',
    kind: 'component',
    title: 'adminPanel',
    tags: ['old']
  }),
  el({
    id: 'cloud.frontend.dashboard',
    kind: 'component',
    title: 'dashboard',
    tags: ['next']
  }),
  el({
    id: 'amazon',
    kind: 'system',
    title: 'amazon',
    tags: ['aws']
  }),
  el({
    id: 'amazon.s3',
    kind: 'component',
    title: 's3',
    shape: 'storage',
    tags: ['aws', 'storage']
  })
] as const

export type FakeElementIds = UnwrapTagged<(typeof fakeElementsArr)[number]['id']>
export type FakeElementKinds = UnwrapTagged<(typeof fakeElementsArr)[number]['kind']>

export const fakeElements = mapToObj(fakeElementsArr, e => [e.id as FakeElementIds, e])

const rel = <Source extends FakeElementIds, Target extends FakeElementIds, Kind extends string>({
  source,
  target,
  title,
  kind,
  tags,
  ...props
}: {
  source: LiteralUnion<Source, string>
  target: LiteralUnion<Target, string>
  title?: string
  kind?: LiteralUnion<Kind, string>
  color?: ThemeColor
  line?: RelationshipLineType
  head?: RelationshipArrowType
  tail?: RelationshipArrowType
  tags?: NonEmptyArray<TestTag>
}) =>
  ({
    id: `${source}:${target}` as Tagged<`${Source}:${Target}`, 'RelationID'>,
    title: title ?? '',
    source: source as Tagged<Source, 'Fqn'>,
    target: target as Tagged<Target, 'Fqn'>,
    ...(kind ? { kind: kind as Tagged<Kind, 'RelationshipKind'> } : {}),
    tags: tags as NonEmptyArray<Tag> ?? null,
    ...props
  }) satisfies Relation

const fakeRelationsArr = [
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
] as const

export type FakeRelationIds = UnwrapTagged<(typeof fakeRelationsArr)[number]['id']>

export const fakeRelations = mapToObj(fakeRelationsArr, r => [r.id as FakeRelationIds, r])

export const fakeComputedModel = {
  specification: {
    tags: [],
    relationships: {},
    elements: {
      actor: {
        style: {}
      },
      system: {
        style: {}
      },
      container: {
        style: {}
      },
      component: {
        style: {}
      }
    } satisfies Record<FakeElementKinds, ElementKindSpecification>
  },
  elements: fakeElements,
  relations: fakeRelations,
  views: {}
} satisfies ComputedLikeC4Model
