import { type Types, Builder } from '@likec4/core/builder'
import { describe, expect as viExpect, it } from 'vitest'
import {
  materialize,
} from './base'
import { printModel } from './model'

const builder = Builder
  .specification({
    elements: {
      actor: {},
      system: {},
      component: {},
    },
    relationships: {
      likes: {},
      uses: {},
    },
    tags: {
      tag1: {},
      tag2: {},
    },
    metadataKeys: ['key1', 'key2'],
  })

function expectModel(builder: Builder<any>) {
  const data = builder.build()
  return viExpect(
    materialize(printModel({
      // @ts-expect-error - elements coming from the builder are more complex than the ones expected by the model operator, but we only care about the fields used by the operator
      elements: data.elements,
      // @ts-expect-error - relations coming from the builder are more complex than the ones expected by the model operator, but we only care about the fields used by the operator
      relations: data.relations,
    })),
  )
}

describe('model', () => {
  it('should print root elements with properties', () => {
    expectModel(
      builder.model(({ actor, system, component }, _) =>
        _(
          actor('alice', {
            title: 'Alice Title',
            tags: ['tag1', 'tag2' as const],
          }),
          system('cloud', {
            tags: ['tag1'],
            technology: 'some technology',
            icon: 'tech:cloudflare',
            color: 'green',
            description: {
              md: 'Cloud **description**',
            },
            summary: {
              md: 'Cloud **summary**',
            },
          }),
          component('backend', {
            links: [
              { url: '../some/relative' },
              { url: 'https://example.com', title: 'repo' },
            ],
            metadata: {
              key1: ['value1', 'value2'],
              key2: 'value3',
            },
          }),
        )
      ),
    ).toMatchInlineSnapshot(`
      "model {
        alice = actor 'Alice Title' {
          #tag1, #tag2
        }

        cloud = system {
          #tag1
          technology 'some technology'
          summary '''
            Cloud **summary**
          '''
          description '''
            Cloud **description**
          '''
          style {
            color green
            icon tech:cloudflare
          }
        }

        backend = component {
          link ../some/relative
          link https://example.com 'repo'
          metadata {
            key1 [
              'value1',
              'value2'
            ]
            key2 'value3'
          }
        }
      }"
    `)
  })

  it('should print elements tree', () => {
    expectModel(
      builder.model(({ system, component }, _) =>
        _(
          system('cloud', {
            title: 'Cloud Title',
          }),
          component('cloud.backend', {
            title: 'Backend Title',
            tags: ['tag1'],
            description: {
              md: 'Backend **description**\n\n> Blockquote',
            },
            shape: 'component',
          }),
          component('cloud.backend.api', {
            title: 'Backend Title',
            tags: ['tag2'],
          }),
          component('cloud.backend.jobs', {
            title: 'Backend Jobs',
            color: 'indigo',
          }),
          system('shopify').with(
            component('orders'),
            component('inventory'),
          ),
        )
      ),
    ).toMatchInlineSnapshot(`
      "model {
        cloud = system 'Cloud Title' {
          backend = component 'Backend Title' {
            #tag1
            description '''
              Backend **description**

              > Blockquote
            '''
            style {
              shape component
            }

            api = component 'Backend Title' {
              #tag2
            }

            jobs = component 'Backend Jobs' {
              style {
                color indigo
              }
            }
          }
        }

        shopify = system {
          orders = component

          inventory = component
        }
      }"
    `)
  })

  it('should print relationships', () => {
    expectModel(
      builder.model(({ actor, system, component, rel }, _) =>
        _(
          actor('alice', {
            title: 'Alice Title',
          }),
          system('cloud', {
            tags: ['tag1'],
            technology: 'some technology',
            icon: 'tech:cloudflare',
            color: 'green',
          }),
          component('cloud.frontend'),
          component('cloud.backend'),
          rel('alice', 'cloud', {
            kind: 'likes',
          }),
          rel('alice', 'cloud.frontend', {
            links: [
              { url: '../some/relative' },
              { url: 'https://example.com', title: 'repo' },
            ],
            metadata: {
              key1: ['value1', 'value2'],
              key2: 'value3',
            },
          }),
          rel('cloud.frontend', 'cloud.backend', {
            title: 'requests',
            technology: 'HTTPS',
            tags: ['tag2'],
          }),
        )
      ),
    ).toMatchInlineSnapshot(`
      "model {
        alice = actor 'Alice Title'

        cloud = system {
          #tag1
          technology 'some technology'
          style {
            color green
            icon tech:cloudflare
          }

          frontend = component

          backend = component
        }

        alice -[likes]-> cloud

        alice -> cloud.frontend {
          link ../some/relative
          link https://example.com 'repo'
          metadata {
            key1 [
              'value1',
              'value2'
            ]
            key2 'value3'
          }
        }

        cloud.frontend -> cloud.backend 'requests' {
          #tag2
          technology 'HTTPS'
        }
      }"
    `)
  })
})
