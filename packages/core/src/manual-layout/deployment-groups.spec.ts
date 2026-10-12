import { describe, expect, it } from 'vitest'
import type { DiagramNode, LayoutedDeploymentView, NodeId, ViewManualLayoutSnapshot } from '../types'
import { GroupElementKind } from '../types'
import { prepareFixtures } from './__test__/fixture'
import { applyManualLayout } from './applyManualLayout'
import { calcDriftsFromSnapshot } from './calcDriftsFromSnapshot'

function fixture() {
  const { layouted } = prepareFixtures()
  const groupId = '@gr1' as NodeId
  const view: LayoutedDeploymentView = {
    ...layouted,
    _type: 'deployment',
    nodes: layouted.nodes.map(node => {
      if (node.id === 'saas') {
        const { modelRef: _modelRef, ...group } = node
        return { ...group, id: groupId, kind: GroupElementKind }
      }
      return { ...node, parent: node.parent === 'saas' ? groupId : node.parent }
    }),
    edges: layouted.edges.map(edge => ({
      ...edge,
      parent: edge.parent === 'saas' ? groupId : edge.parent,
    })),
  }
  const snapshot: ViewManualLayoutSnapshot<'deployment'> = structuredClone(view)
  return { view, snapshot, groupId }
}

describe('deployment group manual layouts', () => {
  it('auto-applies group color, border and opacity without layout drift', () => {
    const { view, snapshot, groupId } = fixture()
    const updated: LayoutedDeploymentView = {
      ...view,
      nodes: view.nodes.map(node =>
        node.id === groupId
          ? { ...node, color: 'amber', style: { ...node.style, border: 'solid', opacity: 20 } }
          : node
      ),
    }
    const manual = applyManualLayout(updated, snapshot)
    expect(manual.drifts).toBeUndefined()
    expect(manual.nodes.find(node => node.id === groupId)).toMatchObject({
      color: 'amber',
      style: { border: 'solid', opacity: 20 },
    })
    expect(calcDriftsFromSnapshot(updated, snapshot).drifts).toBeUndefined()
  })

  it('detects group membership changes instead of silently applying them', () => {
    const { view, snapshot, groupId } = fixture()
    const updated: LayoutedDeploymentView = {
      ...view,
      nodes: view.nodes.map(node => {
        if (node.id === 'saas.frontend') {
          return { ...node, parent: null }
        }
        if (node.id === groupId) {
          return { ...node, children: node.children.filter(id => id !== 'saas.frontend') }
        }
        return node
      }),
    }
    const result = calcDriftsFromSnapshot(updated, snapshot)
    expect(result.drifts).toContain('nodes-drift')
    expect(result.nodes.find(node => node.id === 'saas.frontend')?.drifts).toContain('parent-changed')
    expect(result.nodes.find(node => node.id === groupId)?.drifts).toContain('children-changed')
  })

  it('detects added and removed deployment groups', () => {
    const { view, snapshot, groupId } = fixture()
    const group = view.nodes.find(node => node.id === groupId)!
    const addedGroup: DiagramNode = {
      ...group,
      id: '@gr2' as NodeId,
      children: [],
      inEdges: [],
      outEdges: [],
    }
    const added = calcDriftsFromSnapshot({ ...view, nodes: [...view.nodes, addedGroup] }, snapshot)
    expect(added.drifts).toContain('nodes-added')
    expect(added.nodes.find(node => node.id === addedGroup.id)?.drifts).toEqual(['added'])

    const removed = calcDriftsFromSnapshot({
      ...view,
      nodes: view.nodes.filter(node => node.id !== groupId).map(node =>
        node.parent === groupId ? { ...node, parent: null } : node
      ),
    }, snapshot)
    expect(removed.drifts).toContain('nodes-removed')
  })

  it('detects groups moved from the root into a deployment boundary', () => {
    const { view, snapshot, groupId } = fixture()
    const updated: LayoutedDeploymentView = {
      ...view,
      nodes: view.nodes.map(node => {
        if (node.id === groupId) {
          return { ...node, parent: 'customer' as NodeId, level: 1 }
        }
        if (node.id === 'customer') {
          return { ...node, children: [groupId], depth: 2 }
        }
        return { ...node, level: node.parent === groupId ? 2 : node.level }
      }),
    }
    const result = calcDriftsFromSnapshot(updated, snapshot)
    expect(result.drifts).toContain('nodes-drift')
    expect(result.nodes.find(node => node.id === groupId)?.drifts).toContain('parent-changed')
    expect(applyManualLayout(updated, snapshot).drifts).toContain('nodes-drift')
  })
})
