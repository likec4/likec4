import { describe, expect, it } from 'vitest'
import { Builder } from '../../../builder/Builder'
import { ihead } from '../../../utils'

describe('Dynamic view step fields', () => {
  describe('Technology inheritance', () => {
    it('should inherit technology from model relationship', () => {
      const edge = Builder
        .specification({
          elements: ['el'],
        })
        .model(({ el, rel }, _) =>
          _(
            el('shopify'),
            el('webhook'),
            rel('shopify', 'webhook', {
              technology: 'HTTP Request Override',
            }),
          )
        )
        .views(({ dynamicView, $step }, _) =>
          _(
            dynamicView(
              'test',
              $step('shopify -> webhook'),
            ),
          )
        )
        .toLikeC4Model()
        .view('test')
        .$view.edges[0]!

      expect(edge).toMatchObject({
        technology: 'HTTP Request Override',
      })
    })

    it('should inherit technology from specification when kind is specified', () => {
      const view = Builder
        .specification({
          elements: ['el'],
          relationships: {
            requests: {
              technology: 'HTTP Request',
            },
          },
        })
        .model(({ el, rel }, _) =>
          _(
            el('shopify'),
            el('webhook'),
            rel('shopify', 'webhook', {
              kind: 'requests',
            }),
          )
        )
        .views(({ dynamicView, $step }, _) =>
          _(
            dynamicView('test').with(
              $step('shopify -> webhook', {
                with: {
                  kind: 'requests',
                },
              }),
            ),
          )
        )
        .toLikeC4Model()
        .view('test')

      const edge = ihead(view.edges())?.$edge
      expect(edge).toMatchObject({
        technology: 'HTTP Request',
      })
    })

    it('should use explicit step technology over model relationship', () => {
      const edge = Builder
        .specification({
          elements: ['el'],
          relationships: {},
        })
        .model(({ el, rel }, _) =>
          _(
            el('shopify'),
            el('webhook'),
            rel('shopify', 'webhook', {
              technology: 'HTTP Request Override',
            }),
          )
        )
        .views(({ dynamicView, $step }, _) =>
          _(
            dynamicView('test').with(
              $step('shopify -> webhook', {
                with: {
                  technology: 'Yes, this works',
                },
              }),
            ),
          )
        )
        .toLikeC4Model()
        .view('test')
        .$view.edges[0]!

      expect(edge).toMatchObject({
        source: 'shopify',
        target: 'webhook',
        technology: 'Yes, this works',
      })
    })

    it('should prefer model relationship technology over specification', () => {
      const edge = Builder
        .specification({
          elements: ['el'],
          relationships: {
            requests: {
              technology: 'HTTP Request',
            },
          },
        })
        .model(({ el, rel }, _) =>
          _(
            el('shopify'),
            el('webhook'),
            rel('shopify', 'webhook', {
              kind: 'requests',
              technology: 'HTTP Request Override',
            }),
          )
        )
        .views(({ dynamicView, $step }, _) =>
          _(
            dynamicView(
              'test',
              $step('shopify -> webhook'),
            ),
          )
        )
        .toLikeC4Model()
        .view('test')
        .$view.edges[0]!

      expect(edge).toMatchObject({
        source: 'shopify',
        target: 'webhook',
        kind: 'requests',
        technology: 'HTTP Request Override',
      })
    })

    it('should use specification technology when step has kind but no explicit technology', () => {
      const edge = Builder
        .specification({
          elements: ['el'],
          relationships: {
            requests: {
              technology: 'HTTP Request',
            },
          },
        })
        .model(({ el, rel }, _) =>
          _(
            el('shopify'),
            el('webhook'),
            rel('shopify', 'webhook', {
              kind: 'requests',
            }),
          )
        )
        .views(({ dynamicView, $step }, _) =>
          _(
            dynamicView(
              'test',
              $step('shopify -> webhook', {
                with: {
                  kind: 'requests',
                },
              }),
            ),
          )
        )
        .toLikeC4Model()
        .view('test')
        .$view.edges[0]!

      expect(edge).toMatchObject({
        source: 'shopify',
        target: 'webhook',
        kind: 'requests',
        technology: 'HTTP Request',
      })
    })
  })

  describe('Description inheritance', () => {
    it('should inherit description from model relationship', () => {
      const edge = Builder
        .specification({
          elements: ['el'],
          relationships: {},
        })
        .model(({ el, rel }, _) =>
          _(
            el('shopify'),
            el('webhook'),
            rel('shopify', 'webhook', {
              description: { txt: 'Makes HTTP request' },
            }),
          )
        )
        .views(({ dynamicView, $step }, _) =>
          _(
            dynamicView(
              'test',
              $step('shopify -> webhook'),
            ),
          )
        )
        .toLikeC4Model()
        .view('test')
        .$view.edges[0]!

      expect(edge).toMatchObject({
        description: { txt: 'Makes HTTP request' },
      })
    })

    it('should use explicit step description over model relationship', () => {
      const edge = Builder
        .specification({
          elements: ['el'],
          relationships: {},
        })
        .model(({ el, rel }, _) =>
          _(
            el('shopify'),
            el('webhook'),
            rel('shopify', 'webhook', {
              description: { txt: 'Makes HTTP request' },
            }),
          )
        )
        .views(({ dynamicView, $step }, _) =>
          _(
            dynamicView(
              'test',
              $step('shopify -> webhook', {
                with: {
                  description: { txt: 'Custom description' },
                },
              }),
            ),
          )
        )
        .toLikeC4Model()
        .view('test')
        .$view.edges[0]!

      expect(edge).toMatchObject({
        description: { txt: 'Custom description' },
      })
    })
  })

  describe('Style inheritance from specification', () => {
    it('should inherit color, line, head, tail from specification when step has kind', () => {
      const edge = Builder
        .specification({
          elements: ['el'],
          relationships: {
            action: {
              color: 'green',
              line: 'solid',
              head: 'open',
              tail: 'diamond',
            },
          },
        })
        .model(({ el }, _) =>
          _(
            el('shopify'),
            el('webhook'),
          )
        )
        .views(({ dynamicView, $step }, _) =>
          _(
            dynamicView(
              'test',
              $step('shopify -> webhook', {
                with: {
                  kind: 'action',
                },
              }),
            ),
          )
        )
        .toLikeC4Model()
        .view('test')
        .$view.edges[0]!

      expect(edge).toMatchObject({
        color: 'green',
        line: 'solid',
        head: 'open',
        tail: 'diamond',
      })
    })

    it('should prefer explicit step styles over specification', () => {
      const edge = Builder
        .specification({
          elements: ['el'],
          relationships: {
            action: {
              color: 'green',
              line: 'solid',
              head: 'open',
              tail: 'diamond',
            },
          },
        })
        .model(({ el }, _) =>
          _(
            el('shopify'),
            el('webhook'),
          )
        )
        .views(({ dynamicView, $step }, _) =>
          _(
            dynamicView(
              'test',
              $step('shopify -> webhook', {
                with: {
                  kind: 'action',
                  color: 'red',
                  line: 'dashed',
                },
              }),
            ),
          )
        )
        .toLikeC4Model()
        .view('test')
        .$view.edges[0]!

      expect(edge).toMatchObject({
        color: 'red',
        line: 'dashed',
        head: 'open',
        tail: 'diamond',
      })
    })

    it('should prefer model relationship styles over specification', () => {
      const edge = Builder
        .specification({
          elements: ['el'],
          relationships: {
            action: {
              color: 'green',
              line: 'solid',
              head: 'open',
              tail: 'diamond',
            },
          },
        })
        .model(({ el, rel }, _) =>
          _(
            el('shopify'),
            el('webhook'),
            rel('shopify', 'webhook', {
              kind: 'action',
              color: 'blue',
              line: 'dotted',
            }),
          )
        )
        .views(({ dynamicView, $step }, _) =>
          _(
            dynamicView(
              'test',
              $step('shopify -> webhook', {
                with: {
                  kind: 'action',
                },
              }),
            ),
          )
        )
        .toLikeC4Model()
        .view('test')
        .$view.edges[0]!

      expect(edge).toMatchObject({
        color: 'blue',
        line: 'dotted',
        head: 'open',
        tail: 'diamond',
      })
    })

    it('should combine technology and styles from specification', () => {
      const edge = Builder
        .specification({
          elements: ['el'],
          relationships: {
            action: {
              technology: 'ACTION',
              color: 'green',
              line: 'solid',
              head: 'open',
              tail: 'diamond',
            },
          },
        })
        .model(({ el }, _) =>
          _(
            el('shopify'),
            el('webhook'),
          )
        )
        .views(({ dynamicView, $step }, _) =>
          _(
            dynamicView(
              'test',
              $step('shopify -> webhook', {
                with: {
                  kind: 'action',
                },
              }),
            ),
          )
        )
        .toLikeC4Model()
        .view('test')
        .$view.edges[0]!

      expect(edge).toMatchObject({
        technology: 'ACTION',
        color: 'green',
        line: 'solid',
        head: 'open',
        tail: 'diamond',
      })
    })
  })

  describe('Combined fields', () => {
    it('should inherit both technology and description from model', () => {
      const edge = Builder
        .specification({
          elements: ['el'],
          relationships: {},
        })
        .model(({ el, rel }, _) =>
          _(
            el('shopify'),
            el('webhook'),
            rel('shopify', 'webhook', {
              technology: 'HTTP Request',
              description: { txt: 'Webhook notification' },
              title: 'notifies',
            }),
          )
        )
        .views(({ dynamicView, $step }, _) =>
          _(
            dynamicView(
              'test',
              $step('shopify -> webhook'),
            ),
          )
        )
        .toLikeC4Model()
        .view('test')
        .$view.edges[0]!

      expect(edge).toMatchObject({
        technology: 'HTTP Request',
        description: { txt: 'Webhook notification' },
        label: 'notifies',
      })
    })
  })
})
