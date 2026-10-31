import { describe, expect, it } from 'vitest'
import { Builder } from '../../builder'

describe('Has summary', () => {
  const builder = Builder
    .specification({
      elements: ['el'],
      deployments: ['node'],
    })
  const { model: { el, model }, deployment: { node, instanceOf, deployment } } = builder.helpers()

  describe('ElementModel', () => {
    it('should return false and fallback if either summary or description is given', () => {
      const m = builder.with(model(
        el('only-description', {
          description: {
            md: 'markdown',
          },
        }),
        el('only-summary', {
          summary: {
            md: 'summary',
          },
        }),
      )).toLikeC4Model()

      expect(m.element('only-description').hasSummary).toBe(false)
      expect(m.element('only-description').summary, 'summary should fallback to description').toBe(
        m.element('only-description').description,
      )

      expect(m.element('only-summary').hasSummary).toBe(false)
      expect(m.element('only-summary').description, 'description should fallback to summary').toBe(
        m.element('only-summary').summary,
      )
    })

    it('should return false when summary equals description', () => {
      const m = builder.with(model(
        el('el', {
          summary: { md: 'markdown' },
          description: { md: 'markdown' },
        }),
      )).toLikeC4Model().element('el')

      expect(m.hasSummary).toBe(false)
      expect(m.summary).toBe(m.description)
    })

    it('should return true when summary is different from description', () => {
      const m = builder.with(model(
        el('el', {
          summary: { md: 'summary' },
          description: { md: 'description' },
        }),
      )).toLikeC4Model().element('el')

      expect(m.hasSummary).toBe(true)
      expect(m.summary).not.toBe(m.description)
    })
  })

  describe('DeploymentElementModel', () => {
    it('should return false if either summary or description is given', () => {
      const m = builder.with(deployment(
        node('only-description', {
          description: { md: 'description' },
        }),
        node('only-summary', {
          summary: { md: 'summary' },
        }),
      )).toLikeC4Model()

      expect(m.deployment.node('only-description').hasSummary).toBe(false)
      expect(m.deployment.node('only-summary').hasSummary).toBe(false)
    })

    it('should return true when summary is different from description', () => {
      const m = builder.with(deployment(
        node('n', {
          summary: { md: 'summary' },
          description: { md: 'description' },
        }),
        node('same', {
          summary: { md: 'same' },
          description: { md: 'same' },
        }),
      )).toLikeC4Model()

      expect(m.deployment.node('n').hasSummary).toBe(true)
      expect(m.deployment.node('same').hasSummary).toBe(false)
    })

    it('should fallback to the element summary and description for an instance', () => {
      const m = builder
        .with(
          model(
            el('el', {
              summary: { md: 'summary' },
              description: { md: 'description' },
            }),
          ),
          deployment(
            node('n').with(
              instanceOf('el'),
            ),
          ),
        )
        .toLikeC4Model()

      expect(m.deployment.instance('n.el').hasSummary).toBe(true)
    })
  })
})
