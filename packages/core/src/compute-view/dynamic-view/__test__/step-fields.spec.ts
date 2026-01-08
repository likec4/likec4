import { describe, expect, it } from 'vitest'
import { Builder } from '../../../builder/Builder'
import type { ParsedDynamicView } from '../../../types'
import { computeDynamicView } from '../compute'

describe('Dynamic view step fields', () => {
  describe('Technology inheritance', () => {
    it('should inherit technology from model relationship', () => {
      const spec = Builder
        .specification({
          elements: {
            el: {},
          },
          relationships: {},
          tags: {},
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

      const model = spec.toLikeC4Model()
      const view = computeDynamicView(model, {
        _type: 'dynamic',
        id: 'usecase1' as any,
        title: null,
        description: null,
        tags: null,
        links: null,
        rules: [],
        steps: [
          {
            source: 'shopify' as any,
            target: 'webhook' as any,
            astPath: '',
            title: null,
          },
        ],
      } as ParsedDynamicView)

      expect(view.edges).toHaveLength(1)
      expect(view.edges[0]).toMatchObject({
        technology: 'HTTP Request Override',
      })
    })

    it('should inherit technology from specification when kind is specified', () => {
      const spec = Builder
        .specification({
          elements: {
            el: {},
          },
          relationships: {
            requests: {
              technology: 'HTTP Request',
            },
          },
          tags: {},
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

      const model = spec.toLikeC4Model()
      const view = computeDynamicView(model, {
        _type: 'dynamic',
        id: 'usecase1' as any,
        title: null,
        description: null,
        tags: null,
        links: null,
        rules: [],
        steps: [
          {
            source: 'shopify' as any,
            target: 'webhook' as any,
            kind: 'requests' as any,
            astPath: '',
            title: null,
          },
        ],
      } as ParsedDynamicView)

      expect(view.edges).toHaveLength(1)
      expect(view.edges[0]).toMatchObject({
        technology: 'HTTP Request',
      })
    })

    it('should use explicit step technology over model relationship', () => {
      const spec = Builder
        .specification({
          elements: {
            el: {},
          },
          relationships: {},
          tags: {},
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

      const model = spec.toLikeC4Model()
      const view = computeDynamicView(model, {
        _type: 'dynamic',
        id: 'usecase1' as any,
        title: null,
        description: null,
        tags: null,
        links: null,
        rules: [],
        steps: [
          {
            source: 'shopify' as any,
            target: 'webhook' as any,
            technology: 'Yes, this works',
            astPath: '',
            title: null,
          },
        ],
      } as ParsedDynamicView)

      expect(view.edges).toHaveLength(1)
      expect(view.edges[0]).toMatchObject({
        technology: 'Yes, this works',
      })
    })

    it('should prefer model relationship technology over specification', () => {
      const spec = Builder
        .specification({
          elements: {
            el: {},
          },
          relationships: {
            requests: {
              technology: 'HTTP Request',
            },
          },
          tags: {},
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

      const model = spec.toLikeC4Model()
      const view = computeDynamicView(model, {
        _type: 'dynamic',
        id: 'usecase1' as any,
        title: null,
        description: null,
        tags: null,
        links: null,
        rules: [],
        steps: [
          {
            source: 'shopify' as any,
            target: 'webhook' as any,
            astPath: '',
            title: null,
          },
        ],
      } as ParsedDynamicView)

      expect(view.edges).toHaveLength(1)
      expect(view.edges[0]).toMatchObject({
        technology: 'HTTP Request Override',
      })
    })

    it('should use specification technology when step has kind but no explicit technology', () => {
      const spec = Builder
        .specification({
          elements: {
            el: {},
          },
          relationships: {
            requests: {
              technology: 'HTTP Request',
            },
          },
          tags: {},
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

      const model = spec.toLikeC4Model()
      const view = computeDynamicView(model, {
        _type: 'dynamic',
        id: 'usecase1' as any,
        title: null,
        description: null,
        tags: null,
        links: null,
        rules: [],
        steps: [
          {
            source: 'shopify' as any,
            target: 'webhook' as any,
            kind: 'requests' as any,
            astPath: '',
            title: null,
          },
        ],
      } as ParsedDynamicView)

      expect(view.edges).toHaveLength(1)
      expect(view.edges[0]).toMatchObject({
        technology: 'HTTP Request',
      })
    })
  })

  describe('Description inheritance', () => {
    it('should inherit description from model relationship', () => {
      const spec = Builder
        .specification({
          elements: {
            el: {},
          },
          relationships: {},
          tags: {},
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

      const model = spec.toLikeC4Model()
      const view = computeDynamicView(model, {
        _type: 'dynamic',
        id: 'usecase1' as any,
        title: null,
        description: null,
        tags: null,
        links: null,
        rules: [],
        steps: [
          {
            source: 'shopify' as any,
            target: 'webhook' as any,
            astPath: '',
            title: null,
          },
        ],
      } as ParsedDynamicView)

      expect(view.edges).toHaveLength(1)
      expect(view.edges[0]).toMatchObject({
        description: { txt: 'Makes HTTP request' },
      })
    })

    it('should use explicit step description over model relationship', () => {
      const spec = Builder
        .specification({
          elements: {
            el: {},
          },
          relationships: {},
          tags: {},
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

      const model = spec.toLikeC4Model()
      const view = computeDynamicView(model, {
        _type: 'dynamic',
        id: 'usecase1' as any,
        title: null,
        description: null,
        tags: null,
        links: null,
        rules: [],
        steps: [
          {
            source: 'shopify' as any,
            target: 'webhook' as any,
            description: { txt: 'Custom description' },
            astPath: '',
            title: null,
          },
        ],
      } as ParsedDynamicView)

      expect(view.edges).toHaveLength(1)
      expect(view.edges[0]).toMatchObject({
        description: { txt: 'Custom description' },
      })
    })
  })

  describe('Combined fields', () => {
    it('should inherit both technology and description from model', () => {
      const spec = Builder
        .specification({
          elements: {
            el: {},
          },
          relationships: {},
          tags: {},
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

      const model = spec.toLikeC4Model()
      const view = computeDynamicView(model, {
        _type: 'dynamic',
        id: 'usecase1' as any,
        title: null,
        description: null,
        tags: null,
        links: null,
        rules: [],
        steps: [
          {
            source: 'shopify' as any,
            target: 'webhook' as any,
            astPath: '',
            title: null,
          },
        ],
      } as ParsedDynamicView)

      expect(view.edges).toHaveLength(1)
      expect(view.edges[0]).toMatchObject({
        technology: 'HTTP Request',
        description: { txt: 'Webhook notification' },
        label: 'notifies',
      })
    })
  })
})
