import type { ComputedView, EdgeId, Fqn, NodeId, RelationID, ViewID } from '@likec4/core/types'

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
      id: 'amazon' as NodeId,
      parent: null,
      title: 'amazon',
      children: []
    },
    {
      id: 'cloud' as NodeId,
      parent: null,
      title: 'cloud',
      children: [
        'cloud.backend' as NodeId,
        'cloud.frontend' as NodeId
      ]
    },
    {
      id: 'customer' as NodeId,
      parent: null,
      title: 'customer',
      children: []
    },
    {
      id: 'support' as NodeId,
      parent: null,
      title: 'support',
      children: []
    },
    {
      id: 'cloud.backend' as NodeId,
      parent: 'cloud' as NodeId,
      title: 'backend',
      children: []
    },
    {
      id: 'cloud.frontend' as NodeId,
      parent: 'cloud' as NodeId,
      title: 'frontend',
      children: []
    }
  ],
  edges: [
    {
      id: 'cloud.frontend:cloud.backend' as EdgeId,
      source: 'cloud.frontend' as NodeId,
      target: 'cloud.backend' as NodeId,
      label: null,
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
      label: null,
      relations: [
        'customer:cloud.frontend.dashboard'
      ] as RelationID[]
    }
  ]
}
