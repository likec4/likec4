import { ModelIndex } from '../model-index'
import type { Element, ElementKind, ElementView, Fqn, Relation, RelationID, ViewID } from '../types'

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
  element component
}

model {

  actor customer
  actor support

  system cloud {
    component backend {
      component graphql
      component storage

      graphql -> storage
    }

    component frontend {
      component dashboard {
        -> graphql
      }
      component adminPanel {
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
    id: 'amazon' as Fqn,
    kind: 'system' as ElementKind,
    title: 'amazon'
  },
  cloud: {
    id: 'cloud' as Fqn,
    kind: 'system' as ElementKind,
    title: 'cloud',
  },
  customer: {
    id: 'customer' as Fqn,
    kind: 'actor' as ElementKind,
    title: 'customer',
  },
  support: {
    id: 'support' as Fqn,
    kind: 'actor' as ElementKind,
    title: 'support'
  },
  'amazon.s3': {
    id: 'amazon.s3' as Fqn,
    kind: 'component' as ElementKind,
    title: 's3'
  },
  'cloud.backend': {
    id: 'cloud.backend' as Fqn,
    kind: 'component' as ElementKind,
    title: 'backend'
  },
  'cloud.frontend': {
    id: 'cloud.frontend' as Fqn,
    kind: 'component' as ElementKind,
    title: 'frontend',
  },
  'cloud.backend.graphql': {
    id: 'cloud.backend.graphql' as Fqn,
    kind: 'component' as ElementKind,
    title: 'graphql',
  },
  'cloud.backend.storage': {
    id: 'cloud.backend.storage' as Fqn,
    kind: 'component' as ElementKind,
    title: 'storage',
  },
  'cloud.frontend.adminPanel': {
    id: 'cloud.frontend.adminPanel' as Fqn,
    kind: 'component' as ElementKind,
    title: 'adminPanel',
  },
  'cloud.frontend.dashboard': {
    id: 'cloud.frontend.dashboard' as Fqn,
    kind: 'component' as ElementKind,
    title: 'dashboard',
  }
} satisfies Record<string, Element>

export const fakeRelations = {
  'customer:cloud.frontend.dashboard': {
    id: 'customer:cloud.frontend.dashboard' as RelationID,
    source: 'customer' as Fqn,
    target: 'cloud.frontend.dashboard' as Fqn,
    title: ''
  },
  'support:cloud.frontend.adminPanel': {
    id: 'support:cloud.frontend.adminPanel' as RelationID,
    source: 'support' as Fqn,
    target: 'cloud.frontend.adminPanel' as Fqn,
    title: ''
  },
  'cloud.backend.storage:amazon.s3': {
    id: 'cloud.backend.storage:amazon.s3' as RelationID,
    source: 'cloud.backend.storage' as Fqn,
    target: 'amazon.s3' as Fqn,
    title: ''
  },
  'cloud.backend.graphql:cloud.backend.storage': {
    id: 'cloud.backend.graphql:cloud.backend.storage' as RelationID,
    source: 'cloud.backend.graphql' as Fqn,
    target: 'cloud.backend.storage' as Fqn,
    title: ''
  },
  'cloud.frontend.dashboard:cloud.backend.graphql': {
    id: 'cloud.frontend.dashboard:cloud.backend.graphql' as RelationID,
    source: 'cloud.frontend.dashboard' as Fqn,
    target: 'cloud.backend.graphql' as Fqn,
    title: ''
  },
  'cloud.frontend.adminPanel:cloud.backend.graphql': {
    id: 'cloud.frontend.adminPanel:cloud.backend.graphql' as RelationID,
    source: 'cloud.frontend.adminPanel' as Fqn,
    target: 'cloud.backend.graphql' as Fqn,
    title: ''
  }
} satisfies Record<string, Relation>

export const fakeElementView: ElementView = {
  id: 'fakeView' as ViewID,
  title: '',
  viewOf: 'cloud' as Fqn,
  rules: [{
    isInclude: true,
    exprs: [
      { wildcard: true }
    ]
  }],
}


export const fakeModel = () => ModelIndex.from({
  elements: fakeElements,
  relations: fakeRelations,
  views: {
    [fakeElementView.id]: fakeElementView
  },
})
