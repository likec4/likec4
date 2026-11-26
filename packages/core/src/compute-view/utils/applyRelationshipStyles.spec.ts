import { describe, expect, it } from 'vitest'
import type { ComputedEdge, ElementViewRule, Tag } from '../../types'
import { scalar } from '../../types'
import { applyRelationshipStyles } from './applyRelationshipStyles'

function e(id: string, props: Partial<ComputedEdge> = {}): ComputedEdge {
  const [source, target] = id.split(':')
  return { id, source, target, color: 'gray', line: 'dashed', ...props } as ComputedEdge
}

const tag = (name: string) => name as Tag

describe('applyRelationshipStyles', () => {
  it('returns the same edges when there are no relationship styles', () => {
    const edges = [e('1:2', { tags: [tag('critical')] })]
    const rules: ElementViewRule[] = [{ include: [] }]
    expect(applyRelationshipStyles(rules, edges)).toBe(edges)
  })

  it('styles edges with the tag and leaves the rest untouched', () => {
    const critical = e('1:2', { tags: [tag('critical')] })
    const plain = e('2:3')
    const rules: ElementViewRule[] = [
      { relationshipStyle: { where: { tag: { eq: tag('critical') } }, color: 'red', line: 'solid', head: 'diamond' } },
    ]
    expect(applyRelationshipStyles(rules, [critical, plain])).toStrictEqual([
      { ...critical, color: 'red', line: 'solid', head: 'diamond' },
      plain,
    ])
  })

  it('matches by relationship kind', () => {
    const async = e('1:2', { kind: 'async' })
    const sync = e('2:3', { kind: 'sync' })
    const rules: ElementViewRule[] = [
      { relationshipStyle: { where: { kind: { eq: 'async' } }, line: 'dotted' } },
    ]
    const [styled, untouched] = applyRelationshipStyles(rules, [async, sync])
    expect(styled?.line).toBe('dotted')
    expect(untouched).toBe(sync)
  })

  it('does not treat a dynamic step as a relationship kind', () => {
    const step = e('1:2', { kind: scalar.StepEdgeKind })
    const rules: ElementViewRule[] = [
      { relationshipStyle: { where: { kind: { neq: 'async' } }, color: 'red' } },
    ]
    expect(applyRelationshipStyles(rules, [step])[0]?.color).toBe('red')
  })

  it('applies matching rules in order, so the later one wins', () => {
    const edge = e('1:2', { tags: [tag('critical'), tag('legacy')] })
    const rules: ElementViewRule[] = [
      { relationshipStyle: { where: { tag: { eq: tag('critical') } }, color: 'red', line: 'solid' } },
      { relationshipStyle: { where: { tag: { eq: tag('legacy') } }, color: 'muted' } },
    ]
    expect(applyRelationshipStyles(rules, [edge])[0]).toMatchObject({ color: 'muted', line: 'solid' })
  })

  it('does not mutate the input edges', () => {
    const edge = e('1:2', { tags: [tag('critical')] })
    const rules: ElementViewRule[] = [
      { relationshipStyle: { where: { tag: { eq: tag('critical') } }, color: 'red' } },
    ]
    applyRelationshipStyles(rules, [edge])
    expect(edge.color).toBe('gray')
  })
})
