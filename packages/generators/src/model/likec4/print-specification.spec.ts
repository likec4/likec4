import type { ElementSpecification, RelationshipSpecification, Tag, TagSpecification } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { materialize } from './base'
import { printSpecification } from './print-specification'

function render(spec: Parameters<typeof printSpecification>[0]): string {
  return materialize(printSpecification(spec))
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
    expect(output).toMatchInlineSnapshot(`"specification {}"`)
  })

  it('prints element kinds without body when no props', () => {
    const output = render({
      ...emptySpec,
      elements: { person: {}, system: {} },
    })
    expect(output).toMatchInlineSnapshot(`
      "specification {
        element person {}
        element system {}
      }"
    `)
  })

  it('prints element kinds with style body', () => {
    const output = render({
      ...emptySpec,
      elements: {
        person: { style: { shape: 'person' } },
      },
    })
    expect(output).toMatchInlineSnapshot(`
      "specification {
        element person {
          style {
            shape person
          }
        }
      }"
    `)
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
        },
      },
    })
    expect(output).toMatchInlineSnapshot(`
      "specification {
        element system {
          title 'My System'
          description ''
            A system
          ''
          technology 'Java'
          notation 'S'
        }
      }"
    `)
  })

  it.todo('prints deployment node kinds')

  it.todo('prints relationship kinds without body')

  // it('prints relationship kinds without body', () => {
  //   const output = render({
  //     ...emptySpec,
  //     relationships: { async: {} },
  //   })
  //   expect(output).toContain('relationship async')
  //   expect(output).not.toContain('relationship async {')
  // })

  // it('prints relationship kinds with props', () => {
  //   const output = render({
  //     ...emptySpec,
  //     relationships: {
  //       async: { color: 'amber', line: 'dotted' } as Partial<RelationshipSpecification>,
  //     },
  //   })
  //   expect(output).toContain('relationship async {')
  //   expect(output).toContain('color amber')
  //   expect(output).toContain('line dotted')
  // })

  // it('prints tags without hex/rgb color as plain tag', () => {
  //   const output = render({
  //     ...emptySpec,
  //     tags: { internal: { color: 'muted' } as TagSpecification },
  //   })
  //   expect(output).toContain('tag internal')
  //   expect(output).not.toContain('tag internal {')
  // })

  // it('prints tags with hex color in block', () => {
  //   const output = render({
  //     ...emptySpec,
  //     tags: { deprecated: { color: '#ff0000' } as TagSpecification },
  //   })
  //   expect(output).toContain('tag deprecated {')
  //   expect(output).toContain('color #ff0000')
  // })

  // it('prints metadata keys', () => {
  //   const output = render({
  //     ...emptySpec,
  //     metadataKeys: ['key1', 'key2'],
  //   })
  //   expect(output).toContain('metadataKey key1')
  //   expect(output).toContain('metadataKey key2')
  // })

  // it('prints custom colors from ThemeColorValues', () => {
  //   const output = render({
  //     ...emptySpec,
  //     customColors: {
  //       primary: {
  //         elements: { hiContrast: '#ffffff', loContrast: '#cccccc', fill: '#000000', stroke: '#111111' },
  //         relationships: { line: '#222222', labelBg: '#333333', label: '#444444' },
  //       } as ThemeColorValues,
  //     },
  //   })
  //   expect(output).toContain('color primary #ffffff')
  // })

  it('prints element kind with tags and links', () => {
    const output = render({
      ...emptySpec,
      elements: {
        service: {
          tags: ['internal', 'v2'] as Tag[],
          links: [{ url: 'https://example.com', title: 'Docs' }],
        },
      },
    })
    expect(output).toMatchInlineSnapshot(`
      "specification {
        element service {
          #internal, #v2
          link https://example.com 'Docs'
        }
      }"
    `)
  })

  it('prints single tag', () => {
    const output = render({
      ...emptySpec,
      tags: { internal: { color: 'muted' } as TagSpecification },
    })
    expect(output).toMatchInlineSnapshot(`
      "specification {
        tag internal
      }"
    `)
  })

  it('prints multiple tags', () => {
    const output = render({
      ...emptySpec,
      tags: {
        internal: { color: 'muted' } as TagSpecification,
        deprecated: { color: 'red' } as TagSpecification,
        experimental: { color: 'amber' } as TagSpecification,
      },
    })
    expect(output).toMatchInlineSnapshot(`
      "specification {
        tag internal
        tag deprecated
        tag experimental
      }"
    `)
  })

  it('prints elements and tags together separated by blank lines', () => {
    const output = render({
      ...emptySpec,
      elements: { person: {}, system: {} },
      tags: { internal: { color: 'muted' } as TagSpecification },
    })
    expect(output).toMatchInlineSnapshot(`
      "specification {
        element person {}
        element system {}

        tag internal
      }"
    `)
  })

  it('prints element kind with summary as txt', () => {
    const output = render({
      ...emptySpec,
      elements: {
        service: {
          summary: { txt: 'A brief summary' },
        },
      },
    })
    expect(output).toMatchInlineSnapshot(`
      "specification {
        element service {
          summary ''
            A brief summary
          ''
        }
      }"
    `)
  })

  it('prints element kind with summary as markdown', () => {
    const output = render({
      ...emptySpec,
      elements: {
        service: {
          summary: { md: 'A **bold** summary' },
        },
      },
    })
    expect(output).toMatchInlineSnapshot(`
      "specification {
        element service {
          summary '''
            A **bold** summary
          '''
        }
      }"
    `)
  })

  it('prints element kind with description as markdown', () => {
    const output = render({
      ...emptySpec,
      elements: {
        service: {
          description: { md: 'This is **important**' },
        },
      },
    })
    expect(output).toMatchInlineSnapshot(`
      "specification {
        element service {
          description '''
            This is **important**
          '''
        }
      }"
    `)
  })

  it('prints element kind with multiple style properties', () => {
    const output = render({
      ...emptySpec,
      elements: {
        service: {
          style: {
            shape: 'rectangle',
            color: 'blue',
            border: 'dashed',
            opacity: 80,
          },
        },
      },
    })
    expect(output).toMatchInlineSnapshot(`
      "specification {
        element service {
          style {
            shape rectangle
            color blue
            border dashed
            opacity 80%
          }
        }
      }"
    `)
  })

  it('prints element kind with icon style properties', () => {
    const output = render({
      ...emptySpec,
      elements: {
        service: {
          style: {
            icon: 'mdi:server',
            iconColor: 'green',
            iconSize: 'xl',
            iconPosition: 'top',
          },
        },
      },
    })
    expect(output).toMatchInlineSnapshot(`
      "specification {
        element service {
          style {
            icon mdi:server
            iconColor green
            iconSize xl
            iconPosition top
          }
        }
      }"
    `)
  })

  it('prints element kind with size, padding, textSize, multiple', () => {
    const output = render({
      ...emptySpec,
      elements: {
        service: {
          style: {
            size: 'lg',
            padding: 'sm',
            textSize: 'xs',
            multiple: true,
          },
        },
      },
    })
    expect(output).toMatchInlineSnapshot(`
      "specification {
        element service {
          style {
            size lg
            padding sm
            textSize xs
            multiple true
          }
        }
      }"
    `)
  })

  it('prints element kind with multiple links', () => {
    const output = render({
      ...emptySpec,
      elements: {
        service: {
          links: [
            { url: 'https://docs.example.com', title: 'Documentation' },
            { url: 'https://github.com/example', title: 'Source' },
            { url: 'https://example.com/api' },
          ],
        },
      },
    })
    expect(output).toMatchInlineSnapshot(`
      "specification {
        element service {
          link https://docs.example.com 'Documentation'
          link https://github.com/example 'Source'
          link https://example.com/api
        }
      }"
    `)
  })

  it('prints element kind with single tag', () => {
    const output = render({
      ...emptySpec,
      elements: {
        service: {
          tags: ['backend'] as Tag[],
        },
      },
    })
    expect(output).toMatchInlineSnapshot(`
      "specification {
        element service {
          #backend
        }
      }"
    `)
  })

  it('prints element with all properties combined', () => {
    const output = render({
      ...emptySpec,
      elements: {
        service: {
          tags: ['internal'] as Tag[],
          title: 'Service',
          summary: { txt: 'A service' },
          description: { txt: 'Full description' },
          technology: 'Node.js',
          notation: 'SVC',
          links: [{ url: 'https://example.com', title: 'Docs' }],
          style: { shape: 'rectangle', color: 'green' },
        },
      },
    })
    expect(output).toMatchInlineSnapshot(`
      "specification {
        element service {
          #internal
          title 'Service'
          summary ''
            A service
          ''
          description ''
            Full description
          ''
          technology 'Node.js'
          notation 'SVC'
          link https://example.com 'Docs'
          style {
            shape rectangle
            color green
          }
        }
      }"
    `)
  })

  it('prints element with title containing single quotes', () => {
    const output = render({
      ...emptySpec,
      elements: {
        service: {
          title: 'It\'s a service',
        },
      },
    })
    expect(output).toMatchInlineSnapshot(`
      "specification {
        element service {
          title 'It\\'s a service'
        }
      }"
    `)
  })

  it('prints multiple elements with different properties', () => {
    const output = render({
      ...emptySpec,
      elements: {
        person: { style: { shape: 'person' } },
        system: { title: 'Core System', technology: 'Java' },
        database: { style: { shape: 'storage', color: 'amber' } },
      },
    })
    expect(output).toMatchInlineSnapshot(`
      "specification {
        element person {
          style {
            shape person
          }
        }
        element system {
          title 'Core System'
          technology 'Java'
        }
        element database {
          style {
            shape storage
            color amber
          }
        }
      }"
    `)
  })
})
