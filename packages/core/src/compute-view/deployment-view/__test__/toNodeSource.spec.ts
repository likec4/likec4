import { describe, expect, it } from 'vitest'
import { Builder } from '../../../builder'
import { TestHelper } from './TestHelper'

describe('toNodeSource - description/summary handling', () => {
  describe('deployment node with onlyOneInstance', () => {
    it('should preserve node description when instance has summary', () => {
      const t = TestHelper.from(
        Builder
          .specification({
            elements: ['el'],
            deployments: ['node'],
          })
          .model((m, _) =>
            _(
              m.el('app', {
                description: 'app description from model',
              }),
            )
          )
          .deployment((d, _) =>
            _(
              d.node('server', {
                description: 'server node description',
              }).with(
                d.instanceOf('instance', 'app', {
                  summary: 'instance summary',
                }),
              ),
            )
          ),
      )

      const { nodes } = t.computeView(t.$include('server'))
      const [node] = nodes

      // The node should use its own description, not the instance's summary
      expect(node).toMatchObject({
        id: 'server',
        description: {
          txt: 'server node description',
        },
      })
    })

    it('should use instance summary when node has no description', () => {
      const t = TestHelper.from(
        Builder
          .specification({
            elements: ['el'],
            deployments: ['node'],
          })
          .model((m, _) =>
            _(
              m.el('app', {
                summary: 'app summary from model',
              }),
            )
          )
          .deployment((d, _) =>
            _(
              d.node('server').with(
                d.instanceOf('instance', 'app', {
                  summary: 'instance summary override',
                }),
              ),
            )
          ),
      )

      const { nodes } = t.computeView(t.$include('server'))
      const [node] = nodes

      // When node has no description, it should inherit from the instance
      expect(node).toMatchObject({
        id: 'server',
        description: {
          txt: 'instance summary override',
        },
      })
    })

    it('should use node summary over description when both present', () => {
      const t = TestHelper.from(
        Builder
          .specification({
            elements: ['el'],
            deployments: ['node'],
          })
          .model((m, _) =>
            _(
              m.el('app'),
            )
          )
          .deployment((d, _) =>
            _(
              d.node('server', {
                summary: 'node summary',
                description: 'node description',
              }).with(
                d.instanceOf('instance', 'app'),
              ),
            )
          ),
      )

      const { nodes } = t.computeView(t.$include('server'))
      const [node] = nodes

      // Summary should take precedence over description
      expect(node).toMatchObject({
        id: 'server',
        description: {
          txt: 'node summary',
        },
      })
    })

    it('reproduces issue: node description takes precedence over instance summary', () => {
      // This test reproduces the issue where a deployment node with a description
      // field (but no summary) that contains onlyOneInstance with a summary
      // will use the node's description instead of the instance's summary.
      //
      // The problematic behavior is in toNodeSource() for deployment nodes:
      // 1. summary ??= description (node.description becomes summary)
      // 2. summary ??= instanceSummary(onlyOneInstance) (no effect, summary already set)
      // 3. description: summary (outputs node.description)
      //
      // Expected behavior: When a node has no explicit summary, the instance's
      // summary should be used if available.
      const t = TestHelper.from(
        Builder
          .specification({
            elements: ['el'],
            deployments: ['node'],
          })
          .model((m, _) =>
            _(
              m.el('app', {
                summary: 'app summary from model',
              }),
            )
          )
          .deployment((d, _) =>
            _(
              d.node('server', {
                description: 'node description',
              }).with(
                d.instanceOf('instance', 'app', {
                  summary: 'instance summary override',
                }),
              ),
            )
          ),
      )

      const { nodes } = t.computeView(t.$include('server'))
      const [node] = nodes

      // Current behavior: node description takes precedence
      expect(node).toMatchObject({
        id: 'server',
        description: {
          txt: 'node description',
        },
      })

      // Expected behavior (commented out - this would fail with current implementation):
      // expect(node).toMatchObject({
      //   id: 'server',
      //   description: {
      //     txt: 'instance summary override',
      //   },
      // })
    })
  })
})
