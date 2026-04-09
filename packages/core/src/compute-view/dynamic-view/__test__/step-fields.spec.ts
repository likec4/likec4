import { describe, expect, it } from 'vitest'
import { Builder } from '../../../builder/Builder'
import type { LikeC4Model } from '../../../model'
import type { DynamicStep, Fqn, ParsedDynamicView, ViewId } from '../../../types'
import { computeDynamicView } from '../compute'

describe('Dynamic view step fields', () => {
  const computeEdgeFromStep = (
    model: LikeC4Model<any>,
    stepOverrides: Partial<DynamicStep> = {},
  ) => {
    const view = computeDynamicView(model, {
      _stage: 'parsed',
      _type: 'dynamic',
      id: 'usecase1' as ViewId,
      title: null,
      description: null,
      tags: null,
      links: null,
      rules: [],
      steps: [
        {
          source: 'shopify' as Fqn,
          target: 'webhook' as Fqn,
          astPath: '',
          title: null,
          ...stepOverrides,
        },
      ],
    } as ParsedDynamicView)
    return view.edges[0]
  }

  describe('Technology inheritance', () => {
    it('should inherit technology from model relationship', () => {
      const model = Builder
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
        .toLikeC4Model()

      const edge = computeEdgeFromStep(model)

      expect(edge).toMatchObject({
        technology: 'HTTP Request Override',
      })
    })

    it('should inherit technology from specification when kind is specified', () => {
      const model = Builder
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
        .toLikeC4Model()

      const edge = computeEdgeFromStep(model, {
        kind: 'requests' as any,
      })

      expect(edge).toMatchObject({
        technology: 'HTTP Request',
      })
    })

    it('should use explicit step technology over model relationship', () => {
      const model = Builder
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
        .toLikeC4Model()

      const edge = computeEdgeFromStep(model, {
        technology: 'Yes, this works',
      })

      expect(edge).toMatchObject({
        technology: 'Yes, this works',
      })
    })

    it('should prefer model relationship technology over specification', () => {
      const model = Builder
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
        .toLikeC4Model()

      const edge = computeEdgeFromStep(model)

      expect(edge).toMatchObject({
        technology: 'HTTP Request Override',
      })
    })

    it('should use specification technology when step has kind but no explicit technology', () => {
      const model = Builder
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
        .toLikeC4Model()

      const edge = computeEdgeFromStep(model, {
        kind: 'requests' as any,
      })

      expect(edge).toMatchObject({
        technology: 'HTTP Request',
      })
    })
  })

  describe('Description inheritance', () => {
    it('should inherit description from model relationship', () => {
      const model = Builder
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
        .toLikeC4Model()

      const edge = computeEdgeFromStep(model)

      expect(edge).toMatchObject({
        description: { txt: 'Makes HTTP request' },
      })
    })

    it('should use explicit step description over model relationship', () => {
      const model = Builder
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
        .toLikeC4Model()

      const edge = computeEdgeFromStep(model, {
        description: { txt: 'Custom description' },
      })

      expect(edge).toMatchObject({
        description: { txt: 'Custom description' },
      })
    })
  })

  describe('Style inheritance from specification', () => {
    it('should inherit color, line, head, tail from specification when step has kind', () => {
      const model = Builder
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
        .toLikeC4Model()

      const edge = computeEdgeFromStep(model, {
        kind: 'action' as any,
      })

      expect(edge).toMatchObject({
        color: 'green',
        line: 'solid',
        head: 'open',
        tail: 'diamond',
      })
    })

    it('should prefer explicit step styles over specification', () => {
      const model = Builder
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
        .toLikeC4Model()

      const edge = computeEdgeFromStep(model, {
        kind: 'action' as any,
        color: 'red',
        line: 'dashed',
      })

      expect(edge).toMatchObject({
        color: 'red',
        line: 'dashed',
        head: 'open',
        tail: 'diamond',
      })
    })

    it('should prefer model relationship styles over specification', () => {
      const model = Builder
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
        .toLikeC4Model()

      const edge = computeEdgeFromStep(model, {
        kind: 'action' as any,
      })

      expect(edge).toMatchObject({
        color: 'blue',
        line: 'dotted',
        head: 'open',
        tail: 'diamond',
      })
    })

    it('should combine technology and styles from specification', () => {
      const model = Builder
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
        .toLikeC4Model()

      const edge = computeEdgeFromStep(model, {
        kind: 'action' as any,
      })

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
      const model = Builder
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
        .toLikeC4Model()

      const edge = computeEdgeFromStep(model)

      expect(edge).toMatchObject({
        technology: 'HTTP Request',
        description: { txt: 'Webhook notification' },
        label: 'notifies',
      })
    })
  })
})
