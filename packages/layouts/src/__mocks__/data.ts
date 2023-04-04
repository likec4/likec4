import type { ComputedView, EdgeId, ElementShape, Fqn, NodeId, RelationID, ThemeColor, ViewID } from '@likec4/core/types'

const base = {
  shape: 'rectangle' as ElementShape,
  color: 'primary' as ThemeColor,
  parent: null as NodeId | null,
  children: [] as NodeId[],
}

export const fakeComputedView: ComputedView = {
  id: 'fakeView' as ViewID,
  title: '',
  viewOf: 'cloud' as Fqn,
  rules: [{
    isInclude: true,
    exprs: [
      { wildcard: true }
    ]
  }],
  nodes: [
    {
      ...base,
      id: 'amazon' as NodeId,
      title: 'amazon',
    },
    {
      ...base,
      id: 'cloud' as NodeId,
      title: 'cloud',
      children: [
        'cloud.backend' as NodeId,
        'cloud.frontend' as NodeId
      ]
    },
    {
      ...base,
      id: 'customer' as NodeId,
      title: 'customer'
    },
    {
      ...base,
      id: 'support' as NodeId,
      title: 'support'
    },
    {
      ...base,
      id: 'cloud.backend' as NodeId,
      parent: 'cloud' as NodeId,
      title: 'backend',
    },
    {
      ...base,
      id: 'cloud.frontend' as NodeId,
      parent: 'cloud' as NodeId,
      title: 'frontend',
    }
  ],
  edges: [
    {
      id: 'cloud.frontend:cloud.backend' as EdgeId,
      source: 'cloud.frontend' as NodeId,
      target: 'cloud.backend' as NodeId,
      label: 'requests',
      relations: [
        'cloud.frontend.dashboard:cloud.backend.graphql',
        'cloud.frontend.adminPanel:cloud.backend.graphql'
      ] as RelationID[]
    },
    {
      id: 'cloud.backend:amazon' as EdgeId,
      source: 'cloud.backend' as NodeId,
      target: 'amazon' as NodeId,
      label: null,
      relations: [
        'cloud.backend.storage:amazon.s3'
      ] as RelationID[]
    },
    {
      id: 'support:cloud.frontend' as EdgeId,
      source: 'support' as NodeId,
      target: 'cloud.frontend' as NodeId,
      label: null,
      relations: [
        'support:cloud.frontend.adminPanel'
      ] as RelationID[]
    },
    {
      id: 'customer:cloud.frontend' as EdgeId,
      source: 'customer' as NodeId,
      target: 'cloud.frontend' as NodeId,
      label: 'opens',
      relations: [
        'customer:cloud.frontend.dashboard'
      ] as RelationID[]
    }
  ]
}

export const fakeComputedView2: ComputedView = {
  'edges': [
    {
      'id': 'system.frontend:system.backend',
      'label': 'requests',
      'relations': [
        '671e3db5eb605d5f245f247d95925bd0953e0e4c',
      ],
      'source': 'system.frontend',
      'target': 'system.backend',
    },
    {
      'id': 'client:system.frontend',
      'label': 'opens',
      'relations': [
        '99bffdfd5c78e024393e6223cd9b19225321a5e3',
      ],
      'source': 'client',
      'target': 'system.frontend',
    },
  ],
  'id': '74f5364fa4b064ce9830043b93d4cc6fce9d85b0',
  'nodes': [
    {
      'children': [],
      'color': 'primary',
      'id': 'client',
      'parent': null,
      'shape': 'rectangle',
      'title': 'client',
    },
    {
      'children': [],
      'color': 'primary',
      'id': 'system.backend',
      'parent': null,
      'shape': 'rectangle',
      'title': 'backend',
    },
    {
      'children': [],
      'color': 'primary',
      'id': 'system.frontend',
      'parent': null,
      'shape': 'rectangle',
      'title': 'frontend',
    },
  ],
  'rules': [
    {
      'exprs': [
        {
          'wildcard': true,
        },
      ],
      'isInclude': true,
    },
  ],
  'title': 'frontend',
  'viewOf': 'system.frontend',
} as any


export const fakeComputedView3Levels: ComputedView = {
  'edges': [
    {
      'id': 'cloud.frontend.dashboard:cloud.backend.graphql',
      'label': null,
      'relations': [
        'cloud.frontend.dashboard:cloud.backend.graphql',
      ],
      'source': 'cloud.frontend.dashboard',
      'target': 'cloud.backend.graphql',
    },
    {
      'id': 'cloud.frontend.adminPanel:cloud.backend.graphql',
      'label': null,
      'relations': [
        'cloud.frontend.adminPanel:cloud.backend.graphql',
      ],
      'source': 'cloud.frontend.adminPanel',
      'target': 'cloud.backend.graphql',
    },
    {
      'id': 'cloud.backend.storage:amazon',
      'label': null,
      'relations': [
        'cloud.backend.storage:amazon.s3',
      ],
      'source': 'cloud.backend.storage',
      'target': 'amazon',
    },
    {
      'id': 'cloud.backend.graphql:cloud.backend.storage',
      'label': null,
      'relations': [
        'cloud.backend.graphql:cloud.backend.storage',
      ],
      'source': 'cloud.backend.graphql',
      'target': 'cloud.backend.storage',
    },
    {
      'id': 'support:cloud.frontend.adminPanel',
      'label': null,
      'relations': [
        'support:cloud.frontend.adminPanel',
      ],
      'source': 'support',
      'target': 'cloud.frontend.adminPanel',
    },
    {
      'id': 'customer:cloud.frontend.dashboard',
      'label': null,
      'relations': [
        'customer:cloud.frontend.dashboard',
      ],
      'source': 'customer',
      'target': 'cloud.frontend.dashboard',
    },
  ],
  'id': 'cloud3levels',
  'nodes': [
    {
      'children': [],
      'color': 'primary',
      'id': 'amazon',
      'parent': null,
      'shape': 'rectangle',
      'title': 'amazon',
    },
    {
      'children': [
        'cloud.backend',
        'cloud.frontend',
      ],
      'color': 'primary',
      'id': 'cloud',
      'navigateTo': 'fakeView',
      'parent': null,
      'shape': 'rectangle',
      'title': 'cloud',
    },
    {
      'children': [],
      'color': 'primary',
      'id': 'customer',
      'parent': null,
      'shape': 'rectangle',
      'title': 'customer',
    },
    {
      'children': [],
      'color': 'primary',
      'id': 'support',
      'parent': null,
      'shape': 'rectangle',
      'title': 'support',
    },
    {
      'children': [
        'cloud.backend.graphql',
        'cloud.backend.storage',
      ],
      'color': 'primary',
      'id': 'cloud.backend',
      'parent': 'cloud',
      'shape': 'rectangle',
      'title': 'backend',
    },
    {
      'children': [
        'cloud.frontend.adminPanel',
        'cloud.frontend.dashboard',
      ],
      'color': 'primary',
      'id': 'cloud.frontend',
      'parent': 'cloud',
      'shape': 'rectangle',
      'title': 'frontend',
    },
    {
      'children': [],
      'color': 'primary',
      'id': 'cloud.backend.graphql',
      'parent': 'cloud.backend',
      'shape': 'rectangle',
      'title': 'graphql',
    },
    {
      'children': [],
      'color': 'primary',
      'id': 'cloud.backend.storage',
      'parent': 'cloud.backend',
      'shape': 'rectangle',
      'title': 'storage',
    },
    {
      'children': [],
      'color': 'primary',
      'id': 'cloud.frontend.adminPanel',
      'parent': 'cloud.frontend',
      'shape': 'rectangle',
      'title': 'adminPanel',
    },
    {
      'children': [],
      'color': 'primary',
      'id': 'cloud.frontend.dashboard',
      'parent': 'cloud.frontend',
      'shape': 'rectangle',
      'title': 'dashboard',
    },
  ],
  'rules': [
    {
      'exprs': [
        {
          'wildcard': true,
        },
        {
          'element': 'cloud.frontend',
          'isDescedants': true,
        },
        {
          'element': 'cloud.backend',
          'isDescedants': true,
        },
      ],
      'isInclude': true,
    },
  ],
  'title': '',
  'viewOf': 'cloud',
} as any
