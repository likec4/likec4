import type { ThemeColorValues } from '@likec4/core/styles'
import type { ElementSpecification, RelationshipSpecification, TagSpecification } from '@likec4/core/types'
import { CompositeGeneratorNode, toString as nodeToString } from 'langium/generate'
import { describe, expect, it } from 'vitest'
import { printSpecification } from './print-specification'

function render(spec: Parameters<typeof printSpecification>[1]): string {
  const out = new CompositeGeneratorNode()
  printSpecification(out, spec)
  return nodeToString(out)
}

const emptySpec = {
  elements: {} as Record<string, Partial<ElementSpecification>>,
  deployments: {} as Record<string, Partial<ElementSpecification>>,
  relationships: {} as Record<string, Partial<RelationshipSpecification>>,
  tags: {} as Record<string, TagSpecification>,
}

describe('printSpecification', () => {
  it('outputs specification block with no content for empty spec', () => {
    const output = render(emptySpec)
    expect(output).toContain('specification {')
    expect(output).toContain('}')
  })

  it('prints element kinds without body when no props', () => {
    const output = render({
      ...emptySpec,
      elements: { person: {}, system: {} },
    })
    expect(output).toContain('element person')
    expect(output).toContain('element system')
  })

  it('prints element kinds with style body', () => {
    const output = render({
      ...emptySpec,
      elements: {
        person: { style: { shape: 'person' } } as Partial<ElementSpecification>,
      },
    })
    expect(output).toContain('element person {')
    expect(output).toContain('style {')
    expect(output).toContain('shape person')
  })

  it('prints element kind with title, notation, description, technology', () => {
    const output = render({
      ...emptySpec,
      elements: {
        system: {
          title: 'My System',
          notation: 'S',
          description: { txt: 'A system' },
          technology: 'Java',
        } as Partial<ElementSpecification>,
      },
    })
    expect(output).toContain('title \'My System\'')
    expect(output).toContain('notation \'S\'')
    expect(output).toContain('description \'A system\'')
    expect(output).toContain('technology \'Java\'')
  })

  it('prints deployment node kinds', () => {
    const output = render({
      ...emptySpec,
      deployments: { env: {}, zone: {} },
    })
    expect(output).toContain('deploymentNode env')
    expect(output).toContain('deploymentNode zone')
  })

  it('prints relationship kinds without body', () => {
    const output = render({
      ...emptySpec,
      relationships: { async: {} },
    })
    expect(output).toContain('relationship async')
    expect(output).not.toContain('relationship async {')
  })

  it('prints relationship kinds with props', () => {
    const output = render({
      ...emptySpec,
      relationships: {
        async: { color: 'amber', line: 'dotted' } as Partial<RelationshipSpecification>,
      },
    })
    expect(output).toContain('relationship async {')
    expect(output).toContain('color amber')
    expect(output).toContain('line dotted')
  })

  it('prints tags without hex/rgb color as plain tag', () => {
    const output = render({
      ...emptySpec,
      tags: { internal: { color: 'muted' } as TagSpecification },
    })
    expect(output).toContain('tag internal')
    expect(output).not.toContain('tag internal {')
  })

  it('prints tags with hex color in block', () => {
    const output = render({
      ...emptySpec,
      tags: { deprecated: { color: '#ff0000' } as TagSpecification },
    })
    expect(output).toContain('tag deprecated {')
    expect(output).toContain('color #ff0000')
  })

  it('prints metadata keys', () => {
    const output = render({
      ...emptySpec,
      metadataKeys: ['key1', 'key2'],
    })
    expect(output).toContain('metadataKey key1')
    expect(output).toContain('metadataKey key2')
  })

  it('prints custom colors from ThemeColorValues', () => {
    const output = render({
      ...emptySpec,
      customColors: {
        primary: {
          elements: { hiContrast: '#ffffff', loContrast: '#cccccc', fill: '#000000', stroke: '#111111' },
          relationships: { line: '#222222', labelBg: '#333333', label: '#444444' },
        } as ThemeColorValues,
      },
    })
    expect(output).toContain('color primary #ffffff')
  })

  it('falls back to loContrast when hiContrast is missing', () => {
    const output = render({
      ...emptySpec,
      customColors: {
        secondary: {
          elements: { loContrast: '#aabbcc', fill: '#000000', stroke: '#111111' },
          relationships: { line: '#222222', labelBg: '#333333', label: '#444444' },
        } as unknown as ThemeColorValues,
      },
    })
    expect(output).toContain('color secondary #aabbcc')
  })

  it('prints element kind with tags and links', () => {
    const output = render({
      ...emptySpec,
      elements: {
        service: {
          tags: ['internal', 'v2'],
          links: [{ url: 'https://example.com', title: 'Docs' }],
        } as unknown as Partial<ElementSpecification>,
      },
    })
    expect(output).toContain('#internal #v2')
    expect(output).toContain('link https://example.com \'Docs\'')
  })
})
