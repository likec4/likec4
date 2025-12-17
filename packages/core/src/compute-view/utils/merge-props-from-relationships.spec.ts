import type { OverrideProperties } from 'type-fest'
import { describe, expect, it } from 'vitest'
import type { aux, DeploymentRelationship, MarkdownOrString, Relationship } from '../../types'
import { mergePropsFromRelationships } from './merge-props-from-relationships'

type TestAux = aux.Any

function relationship({ description, ...props }: Partial<
  OverrideProperties<Relationship<TestAux>, {
    description: string | MarkdownOrString
  }>
> = {}): Relationship<TestAux> {
  if (typeof description === 'string') {
    description = { txt: description }
  }
  return {
    id: 'rel' as any,
    source: 'source' as any,
    target: 'target' as any,
    ...(description && { description }),
    ...props,
  } as Relationship<TestAux>
}

function deploymentRelationship(
  { description, ...props }: Partial<
    OverrideProperties<DeploymentRelationship<TestAux>, {
      description: string | MarkdownOrString
    }>
  > = {},
): DeploymentRelationship<TestAux> {
  if (typeof description === 'string') {
    description = { txt: description }
  }
  return {
    id: 'rel' as any,
    source: 'source' as any,
    target: 'target' as any,
    ...(description && { description }),
    ...props,
  } as DeploymentRelationship<TestAux>
}

describe('mergePropsFromRelationships', () => {
  it('should return empty object when merging empty array', () => {
    const result = mergePropsFromRelationships([])
    expect(result).toEqual({})
  })

  it('should merge single relationship', () => {
    const rel = relationship({
      title: 'API Call',
      description: 'Makes HTTP request',
      technology: 'REST',
      kind: 'http' as any,
      color: 'blue' as any,
      line: 'solid' as any,
      head: 'arrow' as any,
      tail: 'none' as any,
    })
    const result = mergePropsFromRelationships([rel])
    expect(result).toEqual({
      title: 'API Call',
      description: { txt: 'Makes HTTP request' },
      technology: 'REST',
      kind: 'http',
      color: 'blue',
      line: 'solid',
      head: 'arrow',
      tail: 'none',
    })
  })

  it('should merge multiple relationships with same properties', () => {
    const rel1 = relationship({
      title: 'API Call',
      technology: 'REST',
      color: 'blue',
    })
    const rel2 = relationship({
      title: 'API Call',
      technology: 'REST',
      color: 'green',
    })
    const result = mergePropsFromRelationships([rel1, rel2])
    expect(result).toEqual({
      title: 'API Call',
      technology: 'REST',
    })
    expect(result).not.toHaveProperty('color')
  })

  it('should use [...] for title when multiple different titles exist', () => {
    const rel1 = relationship({ title: 'Title 1' })
    const rel2 = relationship({ title: 'Title 2' })
    const result = mergePropsFromRelationships([rel1, rel2])
    expect(result).toHaveProperty('title', '[...]')
  })

  it('should return technology for title when no titles exist', () => {
    const rel1 = relationship({ technology: 'REST' })
    const rel2 = relationship({ technology: 'REST' })
    const result = mergePropsFromRelationships([rel1, rel2])
    expect(result).not.toHaveProperty('technology')
    expect(result).toEqual({
      title: '[REST]',
    })
  })

  it('should collect unique values for each property', () => {
    const rel1 = relationship({
      title: 'Title 1',
      technology: 'REST',
      kind: 'http' as any,
    })
    const rel2 = relationship({
      title: 'Title 2',
      technology: 'GraphQL',
      kind: 'websocket' as any,
    })
    const result = mergePropsFromRelationships([rel1, rel2])

    expect(result).not.toHaveProperty('technology')
    expect(result).not.toHaveProperty('kind')
  })

  it('should merge tags from multiple relationships', () => {
    const rel1 = relationship({
      title: 'API',
      tags: ['tag1' as any, 'tag2' as any],
    })
    const rel2 = relationship({
      title: 'API',
      tags: ['tag2' as any, 'tag3' as any],
    })
    const result = mergePropsFromRelationships([rel1, rel2])
    expect(result).toEqual({
      title: 'API',
      tags: ['tag1', 'tag2', 'tag3'],
    })
  })

  it('should deduplicate tags', () => {
    const rel1 = relationship({
      tags: ['tag1' as any, 'tag1' as any, 'tag2' as any],
    })
    const rel2 = relationship({
      tags: ['tag2' as any, 'tag3' as any],
    })
    const result = mergePropsFromRelationships([rel1, rel2])
    expect(result.tags).toEqual(['tag1', 'tag2', 'tag3'])
  })

  it('should not include tags if empty', () => {
    const rel1 = relationship({ title: 'API' })
    const rel2 = relationship({ title: 'API' })
    const result = mergePropsFromRelationships([rel1, rel2])
    expect(result).not.toHaveProperty('tags')
  })

  it('should merge navigateTo property', () => {
    const rel1 = relationship({ navigateTo: 'view1' as any })
    const rel2 = relationship({ navigateTo: 'view1' as any })
    const result = mergePropsFromRelationships([rel1, rel2])
    expect(result).toEqual({
      navigateTo: 'view1',
    })
  })

  it('should return undefined for navigateTo when multiple different values', () => {
    const rel1 = relationship({ navigateTo: 'view1' as any })
    const rel2 = relationship({ navigateTo: 'view2' as any })
    const result = mergePropsFromRelationships([rel1, rel2])
    expect(result).not.toHaveProperty('navigateTo')
  })

  it('should prefer properties from preferred relationship', () => {
    const rel1 = relationship({
      title: 'Title 1',
      technology: 'REST',
      head: 'diamond',
      color: 'blue' as any,
    })
    const rel2 = relationship({
      title: 'Title 2',
      technology: 'GraphQL',
      color: 'red' as any,
    })
    const prefer = relationship({
      title: 'Preferred Title',
      technology: 'WebSocket',
      line: 'dashed' as any,
    })
    const result = mergePropsFromRelationships([rel1, rel2], prefer)
    expect(result).toEqual({
      title: 'Preferred Title',
      head: 'diamond',
      technology: 'WebSocket',
      line: 'dashed',
    })
  })

  it('should merge prefer with collected properties', () => {
    const rel1 = relationship({
      title: 'Title 1',
      color: 'blue' as any,
    })
    const rel2 = relationship({
      title: 'Title 1',
      color: 'blue' as any,
    })
    const prefer = relationship({
      technology: 'WebSocket',
    })
    const result = mergePropsFromRelationships([rel1, rel2], prefer)
    expect(result).toEqual({
      title: 'Title 1',
      color: 'blue',
      technology: 'WebSocket',
    })
  })

  it('should set title to technology if title is null and technology exists', () => {
    const rel1 = relationship({
      technology: 'REST',
      color: 'blue' as any,
    })
    const rel2 = relationship({
      technology: 'REST',
      color: 'blue' as any,
    })
    const result = mergePropsFromRelationships([rel1, rel2])
    expect(result).toEqual({
      title: '[REST]',
      color: 'blue',
    })
    expect(result).not.toHaveProperty('technology')
  })

  it('should not set title to technology if title already exists', () => {
    const rel1 = relationship({
      title: 'API Call',
      technology: 'REST',
    })
    const rel2 = relationship({
      title: 'API Call',
      technology: 'REST',
    })
    const result = mergePropsFromRelationships([rel1, rel2])
    expect(result).toEqual({
      title: 'API Call',
      technology: 'REST',
    })
  })

  it('should handle description with deep equality check', () => {
    const desc = { txt: 'Description' } as any
    const rel1 = relationship({ description: desc })
    const rel2 = relationship({ description: { txt: 'Description' } as any })
    const result = mergePropsFromRelationships([rel1, rel2])
    expect(result).toEqual({
      description: desc,
    })
  })

  it('should handle different descriptions', () => {
    const rel1 = relationship({ description: { txt: 'Desc 1' } as any })
    const rel2 = relationship({ description: { txt: 'Desc 2' } as any })
    const result = mergePropsFromRelationships([rel1, rel2])
    expect(result).not.toHaveProperty('description')
  })

  it('should work with deployment relationships', () => {
    const rel1 = deploymentRelationship({
      title: 'Deploy',
      technology: 'Docker',
      kind: 'deployment' as any,
    })
    const rel2 = deploymentRelationship({
      title: 'Deploy',
      technology: 'Docker',
      kind: 'deployment' as any,
    })
    const result = mergePropsFromRelationships([rel1, rel2])
    expect(result).toEqual({
      title: 'Deploy',
      technology: 'Docker',
      kind: 'deployment',
    })
  })

  it('should mix regular and deployment relationships', () => {
    const rel1 = relationship({
      title: 'Call',
      color: 'blue' as any,
    })
    const rel2 = deploymentRelationship({
      title: 'Call',
      color: 'blue' as any,
    })
    const result = mergePropsFromRelationships([rel1, rel2])
    expect(result).toEqual({
      title: 'Call',
      color: 'blue',
    })
  })

  it('should handle all arrow and line types', () => {
    const rel1 = relationship({
      head: 'arrow' as any,
      tail: 'diamond' as any,
      line: 'solid' as any,
    })
    const rel2 = relationship({
      head: 'arrow' as any,
      tail: 'diamond' as any,
      line: 'solid' as any,
    })
    const result = mergePropsFromRelationships([rel1, rel2])
    expect(result).toEqual({
      head: 'arrow',
      tail: 'diamond',
      line: 'solid',
    })
  })

  it('should ignore null and undefined values', () => {
    const rel1 = relationship({
      title: 'Title',
      description: null as any,
      technology: undefined as any,
    })
    const rel2 = relationship({
      title: 'Title',
    })
    const result = mergePropsFromRelationships([rel1, rel2])
    expect(result).toEqual({
      title: 'Title',
    })
  })

  it('should prefer null description from preferred relationship, if title set', () => {
    const rel1 = relationship({
      title: 'Title',
      description: 'Description 1',
    })
    const prefer = relationship({
      title: 'Preferred',
      description: null as any,
    })
    const result = mergePropsFromRelationships([rel1], prefer)
    expect(result).toEqual({
      title: 'Preferred',
    })
  })

  it('should handle complex merge scenario', () => {
    const rel1 = relationship({
      title: 'API Call',
      technology: 'REST',
      kind: 'http' as any,
      color: 'blue' as any,
      tags: ['api' as any, 'public' as any],
    })
    const rel2 = relationship({
      title: 'API Call',
      technology: 'REST',
      line: 'solid' as any,
      head: 'arrow' as any,
      tags: ['public' as any, 'sync' as any],
    })
    const rel3 = relationship({
      title: 'API Call',
      kind: 'http' as any,
      tail: 'none' as any,
      navigateTo: 'apiView' as any,
      tags: ['api' as any],
    })
    const result = mergePropsFromRelationships([rel1, rel2, rel3])
    expect(result).toEqual({
      title: 'API Call',
      technology: 'REST',
      kind: 'http',
      color: 'blue',
      line: 'solid',
      head: 'arrow',
      tail: 'none',
      navigateTo: 'apiView',
      tags: ['api', 'public', 'sync'],
    })
  })
})
