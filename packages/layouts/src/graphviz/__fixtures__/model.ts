import type {
  Element,
  ElementKind,
  ElementView,
  Fqn,
  IconUrl,
  ModelRelation,
  NonEmptyArray,
  ParsedLikeC4Model,
  RelationId,
  ViewId
} from '@likec4/core'

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
  style,
  tags,
  ...props
}: Partial<Omit<Element, 'id' | 'kind' | 'tags'>> & {
  id: string
  kind: string
  tags?: NonEmptyArray<string>
}): Element => ({
  id: id as Fqn,
  kind: kind as ElementKind,
  title: title ?? id,
  description: null,
  technology: null,
  tags: tags as NonEmptyArray<any> ?? null,
  links: null,
  style: {
    ...style
  },
  ...props
})
export const fakeElements = {
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
  }),
  'amazon': el({
    id: 'amazon',
    kind: 'system',
    title: 'Amazon',
    description: 'Amazon is a cloud provider'
  }),
  'amazon.s3': el({
    id: 'amazon.s3',
    kind: 'component',
    title: 'S3',
    description: 'S3 is a storage service'
  })
} satisfies Record<string, Element>

export type FakeElementIds = keyof typeof fakeElements

const fakeRelations = {
  'customer:cloud.frontend.dashboard': {
    id: 'customer:cloud.frontend.dashboard' as RelationId,
    source: 'customer' as Fqn,
    target: 'cloud.frontend.dashboard' as Fqn,
    title: 'opens in browser'
  },
  'support:cloud.frontend.adminPanel': {
    id: 'support:cloud.frontend.adminPanel' as RelationId,
    source: 'support' as Fqn,
    target: 'cloud.frontend.adminPanel' as Fqn,
    title: 'manages'
  },
  'cloud.backend.storage:amazon.s3': {
    id: 'cloud.backend.storage:amazon.s3' as RelationId,
    source: 'cloud.backend.storage' as Fqn,
    target: 'amazon.s3' as Fqn,
    title: 'persists artifacts',
    tail: 'odiamond'
  },
  'cloud.backend.graphql:cloud.backend.storage': {
    id: 'cloud.backend.graphql:cloud.backend.storage' as RelationId,
    source: 'cloud.backend.graphql' as Fqn,
    target: 'cloud.backend.storage' as Fqn,
    title: ''
  },
  'cloud.frontend.dashboard:cloud.backend.graphql': {
    id: 'cloud.frontend.dashboard:cloud.backend.graphql' as RelationId,
    source: 'cloud.frontend.dashboard' as Fqn,
    target: 'cloud.backend.graphql' as Fqn,
    title: 'fetches data'
  },
  'cloud.frontend.adminPanel:cloud.backend.graphql': {
    id: 'cloud.frontend.adminPanel:cloud.backend.graphql' as RelationId,
    source: 'cloud.frontend.adminPanel' as Fqn,
    target: 'cloud.backend.graphql' as Fqn,
    title: 'fetches data in zero trust network with sso authentification'
  }
} satisfies Record<string, ModelRelation>

export const indexView = {
  __: 'element',
  id: 'index' as ViewId,
  title: '',
  description: null,
  tags: null,
  links: null,
  customColorDefinitions: {},
  rules: [
    {
      include: [
        {
          wildcard: true
        }
      ]
    }
  ]
} satisfies ElementView

export const cloudView = {
  __: 'element',
  id: 'cloudView' as ViewId,
  title: '',
  description: null,
  tags: null,
  links: null,
  customColorDefinitions: {},
  viewOf: 'cloud' as Fqn,
  rules: [
    {
      include: [{ wildcard: true }]
    }
  ]
} satisfies ElementView

export const cloud3levels = {
  __: 'element',
  id: 'cloud3levels' as ViewId,
  title: '',
  viewOf: 'cloud' as Fqn,
  description: null,
  tags: null,
  links: null,
  customColorDefinitions: {},
  rules: [
    {
      include: [
        // include *
        { wildcard: true },
        // include cloud.frontend.*
        { element: fakeElements['cloud.frontend'].id, isChildren: true },
        // include cloud.backend.*
        { element: fakeElements['cloud.backend'].id, isChildren: true }
      ]
    },
    {
      exclude: [
        // exclude cloud.frontend
        { element: 'cloud.frontend' as Fqn, isChildren: false }
      ]
    }
  ]
} satisfies ElementView

export const amazonView = {
  __: 'element',
  id: 'amazon' as ViewId,
  title: '',
  viewOf: 'amazon' as Fqn,
  description: null,
  tags: null,
  links: null,
  customColorDefinitions: {},
  rules: [
    {
      include: [
        // include *
        { wildcard: true },
        // include cloud
        { element: 'cloud' as Fqn, isChildren: false },
        // include cloud.* -> amazon
        {
          source: { element: 'cloud' as Fqn, isChildren: true },
          target: { element: 'amazon' as Fqn, isChildren: false }
        }
      ]
    }
  ]
} satisfies ElementView

// see https://github.com/likec4/likec4/issues/577
export const issue577View = (icon: string) => ({
  id: 'issue577' as ViewId,
  title: '',
  description: null,
  tags: null,
  links: null,
  customColorDefinitions: {},
  viewOf: 'amazon' as Fqn,
  rules: [
    {
      include: [
        // include *
        { wildcard: true }
      ]
    },
    {
      targets: [
        { wildcard: true }
      ],
      style: {
        color: 'red',
        icon: icon as IconUrl
      }
    }
  ]
} satisfies ElementView)

export const FakeModel: ParsedLikeC4Model = {
  elements: fakeElements,
  relations: fakeRelations,
  views: {},
  specification: {
    elements: {},
    relationships: {},
    deployments: {},
    tags: []
  },
  deployments: {
    elements: {},
    relations: {}
  },
  globals: {
    dynamicPredicates: {},
    predicates: {},
    styles: {}
  }
}
