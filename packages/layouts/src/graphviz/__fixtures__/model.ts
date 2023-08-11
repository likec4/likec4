import { ModelIndex } from '@likec4/core'
import type {
  Element,
  ElementKind,
  ElementView,
  Fqn,
  Opaque,
  Relation,
  RelationID
} from '@likec4/core/types'

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
  'amazon': el({
    id: 'amazon',
    kind: 'system',
    title: 'Amazon',
    description: 'Amazon is a cloud provider'
  }),
  'cloud': el({
    id: 'cloud',
    kind: 'system',
    title: 'cloud'
  }),
  'customer': el({
    id: 'customer',
    kind: 'actor',
    title: 'customer',
    shape: 'person'
  }),
  'support': el({
    id: 'support',
    kind: 'actor',
    title: 'Support Engineer',
    description: 'Support engineers are responsible for supporting customers',
    shape: 'person'
  }),
  'amazon.s3': el({
    id: 'amazon.s3',
    kind: 'component',
    title: 'S3',
    description: 'S3 is a storage service'
  }),
  'cloud.backend': el({
    id: 'cloud.backend',
    kind: 'component',
    title: 'Backend'
  }),
  'cloud.frontend': el({
    id: 'cloud.frontend',
    kind: 'component',
    title: 'Frontend',
    shape: 'browser'
  }),
  'cloud.backend.graphql': el({
    id: 'cloud.backend.graphql',
    kind: 'component',
    title: 'Graphql API',
    description: 'Component that allows to query data via GraphQL.'
  }),
  'cloud.backend.storage': el({
    id: 'cloud.backend.storage',
    kind: 'component',
    title: 'Backend Storage',
    description: 'The backend storage is a component that stores data.',
    shape: 'storage'
  }),
  'cloud.frontend.adminPanel': el({
    id: 'cloud.frontend.adminPanel',
    kind: 'component',
    title: 'Admin Panel Webapp',
    description: 'The admin panel is a webapp that allows support staff to manage customer data.'
  }),
  'cloud.frontend.dashboard': el({
    id: 'cloud.frontend.dashboard',
    kind: 'component',
    title: 'Customer Dashboard Webapp',
    description: 'The customer dashboard is a webapp that allows customers to view their data.'
  })
} satisfies Record<string, Element>

export type FakeElementIds = keyof typeof fakeElements

const fakeRelations = {
  'customer:cloud.frontend.dashboard': {
    id: 'customer:cloud.frontend.dashboard' as RelationID,
    source: 'customer' as Fqn,
    target: 'cloud.frontend.dashboard' as Fqn,
    title: 'opens in browser'
  },
  'support:cloud.frontend.adminPanel': {
    id: 'support:cloud.frontend.adminPanel' as RelationID,
    source: 'support' as Fqn,
    target: 'cloud.frontend.adminPanel' as Fqn,
    title: 'manages'
  },
  'cloud.backend.storage:amazon.s3': {
    id: 'cloud.backend.storage:amazon.s3' as RelationID,
    source: 'cloud.backend.storage' as Fqn,
    target: 'amazon.s3' as Fqn,
    title: 'persists artifacts'
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
    title: 'fetches data'
  },
  'cloud.frontend.adminPanel:cloud.backend.graphql': {
    id: 'cloud.frontend.adminPanel:cloud.backend.graphql' as RelationID,
    source: 'cloud.frontend.adminPanel' as Fqn,
    target: 'cloud.backend.graphql' as Fqn,
    title: 'fetches data in zero trust network with sso authentification'
  }
} satisfies Record<string, Relation>

export const indexView = {
  id: 'index' as Opaque<'index', 'ViewID'>,
  title: '',
  description: null,
  tags: null,
  links: null,
  rules: [
    {
      isInclude: true,
      exprs: [
        {
          wildcard: true
        }
      ]
    }
  ]
} satisfies ElementView

export const cloudView = {
  id: 'cloudView' as Opaque<'cloudView', 'ViewID'>,
  title: '',
  description: null,
  tags: null,
  links: null,
  viewOf: 'cloud' as Fqn,
  rules: [
    {
      isInclude: true,
      exprs: [{ wildcard: true }]
    }
  ]
} satisfies ElementView

export const cloud3levels = {
  id: 'cloud3levels' as Opaque<'cloud3levels', 'ViewID'>,
  title: '',
  viewOf: 'cloud' as Fqn,
  description: null,
  tags: null,
  links: null,
  rules: [
    {
      isInclude: true,
      exprs: [
        // include *
        { wildcard: true },
        // include cloud.frontend.*
        { element: 'cloud.frontend' as Fqn, isDescedants: true },
        // include cloud.backend.*
        { element: 'cloud.backend' as Fqn, isDescedants: true }
      ]
    },
    {
      isInclude: false,
      exprs: [
        // exclude cloud.frontend
        { element: 'cloud.frontend' as Fqn, isDescedants: false }
      ]
    }
  ]
} satisfies ElementView

export const amazonView = {
  id: 'amazon' as Opaque<'amazon', 'ViewID'>,
  title: '',
  viewOf: 'amazon' as Fqn,
  description: null,
  tags: null,
  links: null,
  rules: [
    {
      isInclude: true,
      exprs: [
        // include *
        { wildcard: true },
        // include cloud
        { element: 'cloud' as Fqn, isDescedants: false },
        // include cloud.* -> amazon
        {
          source: { element: 'cloud' as Fqn, isDescedants: true },
          target: { element: 'amazon' as Fqn, isDescedants: false }
        }
      ]
    }
  ]
} satisfies ElementView

export const fakeModel = () =>
  ModelIndex.from({
    elements: fakeElements,
    relations: fakeRelations
  })
