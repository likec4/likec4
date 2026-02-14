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
const el = ({ id, kind, title, style, tags, description, ...props }) => ({
    id: id,
    kind: kind,
    title: title ?? id,
    ...description ? { description: { txt: description } } : {},
    technology: null,
    tags: tags ?? null,
    links: null,
    style: {
        ...style,
    },
    ...props,
});
export const fakeElements = {
    'cloud': el({
        id: 'cloud',
        kind: 'system',
        title: 'cloud',
    }),
    'customer': el({
        id: 'customer',
        kind: 'actor',
        title: 'customer',
        style: {
            shape: 'person',
        },
    }),
    'support': el({
        id: 'support',
        kind: 'actor',
        title: 'Support Engineer',
        description: 'Support engineers are responsible for supporting customers',
        style: {
            shape: 'person',
        },
    }),
    'cloud.backend': el({
        id: 'cloud.backend',
        kind: 'component',
        title: 'Backend',
    }),
    'cloud.frontend': el({
        id: 'cloud.frontend',
        kind: 'component',
        title: 'Frontend',
        style: {
            shape: 'browser',
        },
    }),
    'cloud.backend.graphql': el({
        id: 'cloud.backend.graphql',
        kind: 'component',
        title: 'Graphql API',
        description: 'Component that allows to query data via GraphQL.',
    }),
    'cloud.backend.storage': el({
        id: 'cloud.backend.storage',
        kind: 'component',
        title: 'Backend Storage',
        description: 'The backend storage is a component that stores data.',
        style: {
            shape: 'storage',
        },
    }),
    'cloud.frontend.adminPanel': el({
        id: 'cloud.frontend.adminPanel',
        kind: 'component',
        title: 'Admin Panel Webapp',
        description: 'The admin panel is a webapp that allows support staff to manage customer data.',
    }),
    'cloud.frontend.dashboard': el({
        id: 'cloud.frontend.dashboard',
        kind: 'component',
        title: 'Customer Dashboard Webapp',
        description: 'The customer dashboard is a webapp that allows customers to view their data.',
    }),
    'amazon': el({
        id: 'amazon',
        kind: 'system',
        title: 'Amazon',
        description: 'Amazon is a cloud provider',
    }),
    'amazon.s3': el({
        id: 'amazon.s3',
        kind: 'component',
        title: 'S3',
        description: 'S3 is a storage service',
    }),
};
const fakeRelations = {
    'customer:cloud.frontend.dashboard': {
        id: 'customer:cloud.frontend.dashboard',
        source: { model: 'customer' },
        target: { model: 'cloud.frontend.dashboard' },
        title: 'opens in browser',
    },
    'support:cloud.frontend.adminPanel': {
        id: 'support:cloud.frontend.adminPanel',
        source: { model: 'support' },
        target: { model: 'cloud.frontend.adminPanel' },
        title: 'manages',
    },
    'cloud.backend.storage:amazon.s3': {
        id: 'cloud.backend.storage:amazon.s3',
        source: { model: 'cloud.backend.storage' },
        target: { model: 'amazon.s3' },
        title: 'persists artifacts',
        tail: 'odiamond',
    },
    'cloud.backend.graphql:cloud.backend.storage': {
        id: 'cloud.backend.graphql:cloud.backend.storage',
        source: { model: 'cloud.backend.graphql' },
        target: { model: 'cloud.backend.storage' },
        title: '',
    },
    'cloud.frontend.dashboard:cloud.backend.graphql': {
        id: 'cloud.frontend.dashboard:cloud.backend.graphql',
        source: { model: 'cloud.frontend.dashboard' },
        target: { model: 'cloud.backend.graphql' },
        title: 'fetches data',
    },
    'cloud.frontend.adminPanel:cloud.backend.graphql': {
        id: 'cloud.frontend.adminPanel:cloud.backend.graphql',
        source: { model: 'cloud.frontend.adminPanel' },
        target: { model: 'cloud.backend.graphql' },
        title: 'fetches data in zero trust network with sso authentification',
    },
};
export const indexView = {
    _stage: 'parsed',
    _type: 'element',
    id: 'index',
    title: '',
    description: null,
    tags: null,
    links: null,
    rules: [
        {
            include: [
                {
                    wildcard: true,
                },
            ],
        },
    ],
};
export const cloudView = {
    _stage: 'parsed',
    _type: 'element',
    id: 'cloudView',
    title: '',
    description: null,
    tags: null,
    links: null,
    viewOf: 'cloud',
    rules: [
        {
            include: [{ wildcard: true }],
        },
    ],
};
export const cloud3levels = {
    _stage: 'parsed',
    _type: 'element',
    id: 'cloud3levels',
    title: '',
    viewOf: 'cloud',
    description: null,
    tags: null,
    links: null,
    rules: [
        {
            include: [
                // include *
                { wildcard: true },
                // include cloud.frontend.*
                {
                    ref: { model: 'cloud.frontend' },
                    selector: 'children',
                },
                // include cloud.backend.*
                {
                    ref: { model: 'cloud.backend' },
                    selector: 'children',
                },
            ],
        },
        {
            exclude: [
                // exclude cloud.frontend
                { ref: { model: 'cloud.frontend' } },
            ],
        },
    ],
};
export const amazonView = {
    _stage: 'parsed',
    _type: 'element',
    id: 'amazon',
    title: '',
    viewOf: 'amazon',
    description: null,
    tags: null,
    links: null,
    rules: [
        {
            include: [
                // include *
                { wildcard: true },
                // include cloud
                { ref: { model: 'cloud' } },
                // include cloud.* -> amazon
                {
                    source: { ref: { model: 'cloud' }, selector: 'children' },
                    target: { ref: { model: 'amazon' } },
                },
            ],
        },
    ],
};
// see https://github.com/likec4/likec4/issues/577
export const issue577View = (icon) => ({
    _stage: 'parsed',
    _type: 'element',
    id: 'issue577',
    title: '',
    description: null,
    tags: null,
    links: null,
    viewOf: 'amazon',
    rules: [
        {
            include: [
                // include *
                { wildcard: true },
            ],
        },
        {
            targets: [
                { wildcard: true },
            ],
            style: {
                color: 'red',
                icon: icon,
            },
        },
    ],
});
export const FakeModel = {
    _type: 'computed',
    projectId: 'test',
    project: { id: 'test' },
    elements: fakeElements,
    relations: fakeRelations,
    views: {},
    specification: {
        elements: {
            actor: {},
            system: {},
            component: {},
        },
        relationships: {},
        deployments: {},
        tags: {},
    },
    deployments: {
        elements: {},
        relations: {},
    },
    globals: {
        dynamicPredicates: {},
        predicates: {},
        styles: {},
    },
    imports: {},
};
