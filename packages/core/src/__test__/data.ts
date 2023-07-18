import { ModelIndex } from '../model-index'
import type { Element, Relation, Tag } from '../types'

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
export const fakeElements = {
  amazon: {
    id: 'amazon',
    kind: 'system',
    title: 'amazon'
  },
  cloud: {
    id: 'cloud',
    kind: 'system',
    title: 'cloud'
  },
  customer: {
    id: 'customer',
    kind: 'actor',
    title: 'customer',
    shape: 'person'
  },
  support: {
    id: 'support',
    kind: 'actor',
    title: 'support',
    shape: 'person'
  },
  'amazon.s3': {
    id: 'amazon.s3',
    kind: 'component',
    title: 's3',
    shape: 'storage'
  },
  'cloud.backend': {
    id: 'cloud.backend',
    kind: 'container',
    title: 'backend'
  },
  'cloud.frontend': {
    id: 'cloud.frontend',
    kind: 'container',
    title: 'frontend',
    shape: 'browser'
  },
  'cloud.backend.graphql': {
    id: 'cloud.backend.graphql',
    kind: 'component',
    title: 'graphql'
  },
  'cloud.backend.storage': {
    id: 'cloud.backend.storage',
    kind: 'component',
    title: 'storage',
    tags: ['old' as Tag]
  },
  'cloud.frontend.adminPanel': {
    id: 'cloud.frontend.adminPanel',
    kind: 'component',
    title: 'adminPanel',
    tags: ['old' as Tag]
  },
  'cloud.frontend.dashboard': {
    id: 'cloud.frontend.dashboard',
    kind: 'component',
    title: 'dashboard'
  }
} satisfies Record<
  string,
  Omit<Element, 'id' | 'kind'> & {
    id: string
    kind: string
  }
>
export type FakeElementIds = keyof typeof fakeElements

export const fakeRelations = {
  'customer:cloud.frontend.dashboard': {
    id: 'customer:cloud.frontend.dashboard',
    source: 'customer',
    target: 'cloud.frontend.dashboard',
    title: ''
  },
  'support:cloud.frontend.adminPanel': {
    id: 'support:cloud.frontend.adminPanel',
    source: 'support',
    target: 'cloud.frontend.adminPanel',
    title: ''
  },
  'cloud.backend.storage:amazon.s3': {
    id: 'cloud.backend.storage:amazon.s3',
    source: 'cloud.backend.storage',
    target: 'amazon.s3',
    title: ''
  },
  'cloud.backend.graphql:cloud.backend.storage': {
    id: 'cloud.backend.graphql:cloud.backend.storage',
    source: 'cloud.backend.graphql',
    target: 'cloud.backend.storage',
    title: ''
  },
  'cloud.frontend.dashboard:cloud.backend.graphql': {
    id: 'cloud.frontend.dashboard:cloud.backend.graphql',
    source: 'cloud.frontend.dashboard',
    target: 'cloud.backend.graphql',
    title: ''
  },
  'cloud.frontend.adminPanel:cloud.backend.graphql': {
    id: 'cloud.frontend.adminPanel:cloud.backend.graphql',
    source: 'cloud.frontend.adminPanel',
    target: 'cloud.backend.graphql',
    title: ''
  }
} satisfies Record<
  string,
  Omit<Relation, 'id' | 'source' | 'target'> & {
    id: string
    source: string
    target: string
  }
>

export type FakeRelationIds = keyof typeof fakeRelations

export const fakeModel = () =>
  ModelIndex.from({
    elements: fakeElements,
    relations: fakeRelations
  })
