import type { AnyAux, AutoLayoutDirection, MarkdownOrString } from '@likec4/core/types'
import { FqnRef } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import {
  buildTree,
  printAutoLayoutDirection,
  printDeploymentRef,
  printModelRef,
  quoteMarkdownOrString,
  quoteString,
} from './utils'

describe('quoteString', () => {
  it('wraps simple strings in single quotes', () => {
    expect(quoteString('hello')).toBe('\'hello\'')
  })

  it('uses double quotes when string contains single quotes', () => {
    expect(quoteString('it\'s')).toBe('"it\'s"')
  })

  it('escapes single quotes when both quote types present', () => {
    expect(quoteString('it\'s a "test"')).toBe('\'it\\\'s a "test"\'')
  })
})

describe('quoteMarkdownOrString', () => {
  it('wraps plain text with quoteString', () => {
    const value: MarkdownOrString = { txt: 'hello' }
    expect(quoteMarkdownOrString(value)).toBe('\'hello\'')
  })

  it('wraps markdown with triple-quote fences', () => {
    const value: MarkdownOrString = { md: '# Title\nSome **bold** text' }
    expect(quoteMarkdownOrString(value)).toBe('\'\'\'\n# Title\nSome **bold** text\n\'\'\'')
  })
})

describe('printAutoLayoutDirection', () => {
  it.each([
    ['TB', 'TopBottom'],
    ['BT', 'BottomTop'],
    ['LR', 'LeftRight'],
    ['RL', 'RightLeft'],
  ] as [AutoLayoutDirection, string][])('maps %s to %s', (input, expected) => {
    expect(printAutoLayoutDirection(input)).toBe(expected)
  })
})

describe('printModelRef', () => {
  it('prints simple model ref', () => {
    const ref = { model: 'cloud.backend' } as FqnRef.ModelRef
    expect(printModelRef(ref)).toBe('cloud.backend')
  })

  it('prints import ref with @ prefix', () => {
    const ref = { project: 'myproject', model: 'cloud' } as unknown as FqnRef.ModelRef
    expect(printModelRef(ref)).toBe('@myproject.cloud')
  })
})

describe('printDeploymentRef', () => {
  it('prints simple deployment ref', () => {
    const ref = { deployment: 'prod.eu' } as FqnRef.DeploymentRef<AnyAux>
    expect(printDeploymentRef(ref)).toBe('prod.eu')
  })

  it('prints inside-instance ref with element', () => {
    const ref = { deployment: 'prod.eu.api', element: 'backend.api' } as unknown as FqnRef.DeploymentRef<AnyAux>
    expect(printDeploymentRef(ref)).toBe('prod.eu.api.backend.api')
  })
})

describe('buildTree', () => {
  it('builds a flat list for root-only elements', () => {
    const elements = {
      'a': { id: 'a' },
      'b': { id: 'b' },
    }
    const tree = buildTree(elements)
    expect(tree).toHaveLength(2)
    expect(tree[0]!.name).toBe('a')
    expect(tree[1]!.name).toBe('b')
    expect(tree[0]!.children).toHaveLength(0)
  })

  it('nests children under parents by FQN', () => {
    const elements = {
      'cloud': { id: 'cloud' },
      'cloud.backend': { id: 'cloud.backend' },
      'cloud.frontend': { id: 'cloud.frontend' },
      'cloud.backend.api': { id: 'cloud.backend.api' },
    }
    const tree = buildTree(elements)
    expect(tree).toHaveLength(1)
    expect(tree[0]!.name).toBe('cloud')
    expect(tree[0]!.children).toHaveLength(2)

    const backend = tree[0]!.children.find(c => c.name === 'backend')!
    expect(backend.children).toHaveLength(1)
    expect(backend.children[0]!.name).toBe('api')
  })

  it('returns empty array for empty input', () => {
    expect(buildTree({})).toEqual([])
  })

  it('preserves element references', () => {
    const el = { id: 'x', extra: 'data' }
    const tree = buildTree({ x: el })
    expect(tree[0]!.element).toBe(el)
  })
})
