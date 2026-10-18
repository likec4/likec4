import type { AnyAux, ComputedNode, NodeId } from '../../types'
import { invariant, nonNullable, parentFqn } from '../../utils'
import type { Memory } from './memory'

export function groupDeploymentNodes<A extends AnyAux>(
  nodes: ReadonlyMap<NodeId, ComputedNode<A>>,
  memory: Memory,
): void {
  if (memory.groups.length === 0) {
    return
  }
  const groups = new Map(memory.groups.map(group => [group.id, group]))
  const members = new Map(memory.groups.map(group => [group.id, new Set<NodeId>()]))
  const assignments = new Map([...memory.lastSeenIn, ...memory.explicitFirstSeenIn])
  const endpoints = new Set(memory.connections.flatMap(connection => [connection.source, connection.target]))
  const selected = [...memory.final].filter(element => {
    const groupId = assignments.get(element)
    // Implicit relationship boundaries remain containers, rather than becoming group members themselves.
    return groupId !== undefined && groups.has(groupId)
      && (memory.explicitFirstSeenIn.has(element) || endpoints.has(element))
  })

  for (const element of selected) {
    const groupId = nonNullable(assignments.get(element))
    nonNullable(members.get(groupId)).add(element.id as NodeId)
  }
  for (const group of [...memory.groups].reverse()) {
    if (group.parent) {
      const parentMembers = nonNullable(members.get(group.parent))
      for (const member of nonNullable(members.get(group.id))) {
        parentMembers.add(member)
      }
    }
  }

  const deploymentParents = new Map(
    [...nodes.values()]
      .filter(node => node.deploymentRef)
      .map(node => [node.id, node.parent]),
  )
  const ancestors = (id: NodeId): NodeId[] => {
    const result: NodeId[] = []
    let parent = deploymentParents.get(id)
    while (parent) {
      result.push(parent)
      parent = deploymentParents.get(parent)
    }
    return result
  }
  const isWithin = (id: NodeId, ancestor: NodeId): boolean => {
    let parent: NodeId | null = id
    while (parent) {
      if (parent === ancestor) {
        return true
      }
      parent = nonNullable(nodes.get(parent)).parent
    }
    return false
  }
  const isDeclaredParent = (id: NodeId, groupId: NodeId): boolean => {
    let parent = nonNullable(groups.get(groupId)).parent
    while (parent) {
      if (parent === id) {
        return true
      }
      parent = nonNullable(groups.get(parent)).parent
    }
    return false
  }

  for (const group of memory.groups) {
    const groupMembers = nonNullable(members.get(group.id))
    const roots = [...groupMembers].filter(id => !ancestors(id).some(ancestor => groupMembers.has(ancestor)))
    const [first, ...rest] = roots
    if (!first) {
      continue
    }
    const anchor = deploymentParents.get(first) ?? null
    const deploymentParent = parentFqn(first)
    for (const member of rest) {
      const parent = parentFqn(member)
      invariant(
        parent === deploymentParent,
        `Cannot place deployment group "${group.viewRule.title ?? group.id}": members "${first}" and "${member}" `
          + `have different deployment parents ("${deploymentParent ?? '<root>'}" and "${parent ?? '<root>'}"). `
          + 'All members must share the same deployment parent.',
      )
    }
    const groupNode = nonNullable(nodes.get(group.id))
    groupNode.parent = group.parent && (!anchor || !isWithin(anchor, group.parent)) ? group.parent : anchor

    for (const branch of roots) {
      const branchNode = nonNullable(nodes.get(branch))
      // Nested groups may refine their outer group's branches. Unrelated groups must not split a deployment container.
      invariant(
        branchNode.parent === anchor || (branchNode.parent && isDeclaredParent(branchNode.parent, group.id)),
        `Cannot place deployment group "${group.viewRule.title ?? group.id}": container "${branch}" already belongs to `
          + `group "${branchNode.parent ? nodes.get(branchNode.parent)?.title || branchNode.parent : ''}". `
          + 'Sibling groups cannot wrap the same deployment container.',
      )
      branchNode.parent = group.id
    }
  }

  for (const node of nodes.values()) {
    node.children = []
  }
  for (const node of nodes.values()) {
    if (node.parent) {
      nonNullable(nodes.get(node.parent)).children.push(node.id)
    }
  }
  const visited = new Set<NodeId>()
  const updateHierarchy = (node: ComputedNode<A>, level: number): number => {
    invariant(!visited.has(node.id), `Cycle in deployment group hierarchy at ${node.id}`)
    visited.add(node.id)
    node.level = level
    const depth = node.children.reduce(
      (depth, id) => Math.max(depth, updateHierarchy(nonNullable(nodes.get(id)), level + 1) + 1),
      0,
    )
    if (depth > 0 || groups.has(node.id)) {
      node.depth = depth
    } else {
      delete node.depth
    }
    return depth
  }
  for (const node of nodes.values()) {
    if (!node.parent) {
      updateHierarchy(node, 0)
    }
  }
  invariant(visited.size === nodes.size, 'Deployment group hierarchy must be rooted and acyclic')
}
