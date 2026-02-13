import type { ModelGlobals } from '@likec4/core/types'
import { CompositeGeneratorNode, toString as nodeToString } from 'langium/generate'
import { describe, expect, it } from 'vitest'
import { printGlobals } from './print-globals'

function render(globals: ModelGlobals): string {
  const out = new CompositeGeneratorNode()
  printGlobals(out, globals)
  return nodeToString(out)
}

const emptyGlobals: ModelGlobals = {
  predicates: {},
  dynamicPredicates: {},
  styles: {},
} as ModelGlobals

describe('printGlobals', () => {
  it('does nothing for empty globals', () => {
    const output = render(emptyGlobals)
    expect(output).toBe('')
  })

  it('prints global block wrapper when content exists', () => {
    const output = render({
      ...emptyGlobals,
      predicates: {
        myPred: [{ include: [{ wildcard: true }] }],
      },
    } as any)
    expect(output).toContain('global {')
    expect(output).toContain('}')
  })

  it('prints predicate group with include', () => {
    const output = render({
      ...emptyGlobals,
      predicates: {
        myPred: [{ include: [{ wildcard: true }] }],
      },
    } as any)
    expect(output).toContain('predicateGroup myPred {')
    expect(output).toContain('include')
    expect(output).toContain('*')
  })

  it('prints predicate group with exclude', () => {
    const output = render({
      ...emptyGlobals,
      predicates: {
        myPred: [{ exclude: [{ ref: { model: 'cloud' } }] }],
      },
    } as any)
    expect(output).toContain('predicateGroup myPred {')
    expect(output).toContain('exclude')
    expect(output).toContain('cloud')
  })

  it('prints dynamic predicate group', () => {
    const output = render({
      ...emptyGlobals,
      dynamicPredicates: {
        dynPred: [{ include: [{ ref: { model: 'cloud' } }] }],
      },
    } as any)
    expect(output).toContain('dynamicPredicateGroup dynPred {')
    expect(output).toContain('include cloud')
  })

  it('prints style group', () => {
    const output = render({
      ...emptyGlobals,
      styles: {
        myStyle: [{
          targets: [{ wildcard: true }],
          style: { color: 'red' },
        }],
      },
    } as any)
    expect(output).toContain('styleGroup myStyle {')
    expect(output).toContain('style * {')
    expect(output).toContain('color red')
  })

  it('prints style group with notation', () => {
    const output = render({
      ...emptyGlobals,
      styles: {
        myStyle: [{
          targets: [{ wildcard: true }],
          style: { shape: 'browser' },
          notation: 'Web App',
        }],
      },
    } as any)
    expect(output).toContain('shape browser')
    expect(output).toContain('notation \'Web App\'')
  })
})
