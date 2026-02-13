import type { DeploymentElement, DeploymentRelationship } from '@likec4/core/types'
import { CompositeGeneratorNode, toString as nodeToString } from 'langium/generate'
import { describe, expect, it } from 'vitest'
import { printDeployment } from './print-deployment'

function render(
  elements: Record<string, DeploymentElement>,
  relations: Record<string, DeploymentRelationship>,
): string {
  const out = new CompositeGeneratorNode()
  printDeployment(out, { elements, relations })
  return nodeToString(out)
}

function makeDeploymentNode(overrides: Partial<DeploymentElement> & { id: string; kind: string }): DeploymentElement {
  return {
    title: '',
    description: undefined,
    summary: undefined,
    technology: undefined,
    notation: undefined,
    tags: [],
    links: [],
    metadata: {},
    style: {},
    ...overrides,
  } as DeploymentElement
}

function makeInstance(overrides: Partial<DeploymentElement> & { id: string; element: string }): DeploymentElement {
  return {
    title: '',
    description: undefined,
    summary: undefined,
    technology: undefined,
    notation: undefined,
    tags: [],
    links: [],
    metadata: {},
    style: {},
    ...overrides,
  } as DeploymentElement
}

function makeDeploymentRelation(
  overrides: Partial<DeploymentRelationship> & { id: string },
): DeploymentRelationship {
  return {
    source: { deployment: 'a' },
    target: { deployment: 'b' },
    title: '',
    description: undefined,
    technology: undefined,
    tags: [],
    links: [],
    ...overrides,
  } as DeploymentRelationship
}

describe('printDeployment', () => {
  it('does nothing for empty deployments', () => {
    const output = render({}, {})
    expect(output).toBe('')
  })

  it('prints deployment block wrapper', () => {
    const output = render(
      { prod: makeDeploymentNode({ id: 'prod', kind: 'env' }) },
      {},
    )
    expect(output).toContain('deployment {')
    expect(output).toContain('}')
  })

  it('prints deployment node', () => {
    const output = render(
      { prod: makeDeploymentNode({ id: 'prod', kind: 'env' }) },
      {},
    )
    expect(output).toContain('env prod')
  })

  it('prints deployment node with title', () => {
    const output = render(
      { prod: makeDeploymentNode({ id: 'prod', kind: 'env', title: 'Production' }) },
      {},
    )
    expect(output).toContain('env prod \'Production\'')
  })

  it('prints nested deployment nodes', () => {
    const output = render(
      {
        'prod': makeDeploymentNode({ id: 'prod', kind: 'env' }),
        'prod.eu': makeDeploymentNode({ id: 'prod.eu', kind: 'zone' }),
      },
      {},
    )
    expect(output).toContain('env prod')
    expect(output).toContain('zone eu')
  })

  it('prints instanceOf with same local name', () => {
    const output = render(
      { 'prod.api': makeInstance({ id: 'prod.api', element: 'cloud.api' }) },
      {},
    )
    expect(output).toContain('instanceOf cloud.api')
  })

  it('prints instanceOf with different name (uses assignment)', () => {
    const output = render(
      { 'prod.myapi': makeInstance({ id: 'prod.myapi', element: 'cloud.api' }) },
      {},
    )
    expect(output).toContain('myapi = instanceOf cloud.api')
  })

  it('prints deployment node with description', () => {
    const output = render(
      {
        prod: makeDeploymentNode({
          id: 'prod',
          kind: 'env',
          description: { txt: 'Production env' },
        }),
      },
      {},
    )
    expect(output).toContain('description \'Production env\'')
  })

  it('prints deployment node with style', () => {
    const output = render(
      {
        prod: makeDeploymentNode({
          id: 'prod',
          kind: 'env',
          style: { shape: 'queue' },
        } as any),
      },
      {},
    )
    expect(output).toContain('style {')
    expect(output).toContain('shape queue')
  })

  it('prints deployment relation', () => {
    const output = render(
      { a: makeDeploymentNode({ id: 'a', kind: 'node' }) },
      {
        r1: makeDeploymentRelation({
          id: 'r1',
          source: { deployment: 'a' } as any,
          target: { deployment: 'b' } as any,
        }),
      },
    )
    expect(output).toContain('a -> b')
  })

  it('prints deployment relation with title', () => {
    const output = render(
      { a: makeDeploymentNode({ id: 'a', kind: 'node' }) },
      {
        r1: makeDeploymentRelation({
          id: 'r1',
          source: { deployment: 'a' } as any,
          target: { deployment: 'b' } as any,
          title: 'replicates',
        }),
      },
    )
    expect(output).toContain('a -> b \'replicates\'')
  })

  it('prints deployment relation with kind', () => {
    const output = render(
      { a: makeDeploymentNode({ id: 'a', kind: 'node' }) },
      {
        r1: makeDeploymentRelation({
          id: 'r1',
          source: { deployment: 'a' } as any,
          target: { deployment: 'b' } as any,
          kind: 'async' as any,
        }),
      },
    )
    expect(output).toContain('a -[async]-> b')
  })

  it('prints deployment relation with body', () => {
    const output = render(
      { a: makeDeploymentNode({ id: 'a', kind: 'node' }) },
      {
        r1: makeDeploymentRelation({
          id: 'r1',
          source: { deployment: 'a' } as any,
          target: { deployment: 'b' } as any,
          color: 'red' as any,
          line: 'dotted' as any,
        }),
      },
    )
    expect(output).toContain('a -> b {')
    expect(output).toContain('color red')
    expect(output).toContain('line dotted')
  })
})
