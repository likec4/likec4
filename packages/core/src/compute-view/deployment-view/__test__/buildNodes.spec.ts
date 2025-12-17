import { indexBy } from 'remeda'
import { describe, expect, it } from 'vitest'
import { Builder } from '../../../builder'
import { TestHelper } from './TestHelper'

describe('deployment node with onlyOneInstance', () => {
  const {
    builder: b,
    model: { el, model },
    deployment: { node, deployment, ...d },
  } = Builder.forSpecification({
    elements: ['el'],
    deployments: ['node'],
  })

  describe('title handling', () => {
    it('should preserve node title from specs', () => {
      const t = TestHelper.from(
        Builder.specification({
          elements: ['el'],
          deployments: {
            node: {
              title: 'node title from spec',
            },
          },
        })
          .model(({ el }, _) =>
            _(
              el('app', {
                title: 'app title from model',
              }),
            )
          )
          .deployment(({ node, ...d }, _) =>
            _(
              node('server').with(
                d.instanceOf('instance', 'app', {
                  title: 'instance title override',
                }),
              ),
            )
          ),
      )

      const [nd] = t.computeView(t.$include('server')).nodes
      // The node should use its own title, not the instance's title
      expect(nd).toMatchObject({
        id: 'server',
        title: 'node title from spec',
      })
    })

    it('should preserve node title when defined', () => {
      const t = TestHelper.from(
        b.with(
          model(
            el('app', {
              title: 'app title from model',
            }),
          ),
          deployment(
            node('server', { title: 'node title' }).with(
              d.instanceOf('instance', 'app', {
                title: 'instance title',
              }),
            ),
          ),
        ),
      )
      const [nd] = t.computeView(t.$include('server')).nodes

      // The node should use its own title, not the instance's title
      expect(nd).toMatchObject({
        id: 'server',
        title: 'node title',
      })
    })

    it('should inherit logical title if not present in deployment model', () => {
      const t = TestHelper.from(
        b.with(
          model(
            el('app', {
              title: 'app title from model',
            }),
          ),
          deployment(
            node('server').with(
              d.instanceOf('instance', 'app'),
            ),
          ),
        ),
      )

      const [nd] = t.computeView(t.$include('server')).nodes
      expect(nd).toMatchObject({
        id: 'server',
        title: 'app title from model',
      })
    })

    it('should inherit title from instance, if not present in deployment node', () => {
      const t = TestHelper.from(
        b.with(
          model(
            el('app', {
              title: 'app title from model',
            }),
          ),
          deployment(
            node('server').with(
              d.instanceOf('instance', 'app', {
                title: 'instance title override',
              }),
            ),
          ),
        ),
      )

      const [nd] = t.computeView(t.$include('server')).nodes
      expect(nd).toMatchObject({
        id: 'server',
        title: 'instance title override',
      })
    })
  })

  describe('description/summary handling', () => {
    it('should preserve node description from specs', () => {
      const t = TestHelper.from(
        Builder.specification({
          elements: ['el'],
          deployments: {
            node: {
              description: {
                txt: 'description from spec',
              },
            },
          },
        })
          .model(({ el }, _) =>
            _(
              el('app', {
                description: 'app description from model',
              }),
            )
          )
          .deployment(({ node, ...d }, _) =>
            _(
              node('server').with(
                d.instanceOf('instance', 'app', {
                  summary: 'instance summary override',
                }),
              ),
            )
          ),
      )

      const [nd] = t.computeView(t.$include('server')).nodes
      // The node should use its own description, not the instance's summary
      expect(nd).toMatchObject({
        id: 'server',
        description: {
          txt: 'description from spec',
        },
      })
    })

    it('should preserve node description when instance has summary', () => {
      const t = TestHelper.from(
        b.with(
          model(
            el('app', {
              description: 'app description from model',
            }),
          ),
          deployment(
            node('server', { description: 'server node description' }).with(
              d.instanceOf('instance', 'app', {
                summary: 'instance summary',
              }),
            ),
          ),
        ),
      )

      const [nd] = t.computeView(t.$include('server')).nodes

      // The node should use its own description, not the instance's summary
      expect(nd).toMatchObject({
        id: 'server',
        description: {
          txt: 'server node description',
        },
      })
    })

    it('should use logical summary if not present in deployment model', () => {
      const t = TestHelper.from(
        b.with(
          model(
            el('app', {
              summary: 'app summary from model',
            }),
          ),
          deployment(
            node('server').with(
              d.instanceOf('instance', 'app'),
            ),
          ),
        ),
      )

      const [nd] = t.computeView(t.$include('server')).nodes
      expect(nd).toMatchObject({
        id: 'server',
        description: {
          txt: 'app summary from model',
        },
      })
    })

    it('should use instance summary when node has no description', () => {
      const t = TestHelper.from(
        b.with(
          model(
            el('app', {
              summary: 'app summary from model',
            }),
          ),
          deployment(
            node('server').with(
              d.instanceOf('instance', 'app', {
                summary: 'instance summary override',
              }),
            ),
          ),
        ),
      )

      const [nd] = t.computeView(t.$include('server')).nodes

      // When node has no description, it should inherit from the instance
      expect(nd).toMatchObject({
        id: 'server',
        description: {
          txt: 'instance summary override',
        },
      })
    })

    it('should use node summary over description when both present', () => {
      const t = TestHelper.from(
        b.with(
          model(
            el('app'),
          ),
          deployment(
            node('server', {
              summary: 'node summary',
              description: 'node description',
            }).with(
              d.instanceOf('instance', 'app', {
                description: 'instance summary override',
              }),
            ),
          ),
        ),
      )

      const [nd] = t.computeView(t.$include('server')).nodes

      // Summary should take precedence over description
      expect(nd).toMatchObject({
        id: 'server',
        description: {
          txt: 'node summary',
        },
      })
    })

    it('node description takes precedence over instance summary', () => {
      const t = TestHelper.from(
        b.with(
          model(
            el('app', {
              summary: 'app summary from model',
            }),
          ),
          deployment(
            node('server', {
              description: 'node description',
            }).with(
              d.instanceOf('instance', 'app', {
                summary: 'instance summary override',
              }),
            ),
          ),
        ),
      )

      const [nd] = t.computeView(t.$include('server')).nodes
      expect(nd).toMatchObject({
        id: 'server',
        description: {
          txt: 'node description',
        },
      })
    })
  })

  it('verifies #2387', () => {
    const t = TestHelper.from(
      Builder.specification({
        elements: ['external_system'],
        deployments: ['kubernetesNamespace'],
      })
        .model(({ external_system }, _) =>
          _(
            external_system('ca', 'Certificate Authority'),
            external_system('identity', 'Identity Provider'),
          )
        )
        .deployment(({ deployment, kubernetesNamespace, ...d }, _) =>
          _(
            kubernetesNamespace('cert_manager', { title: 'cert-manager' }).with(
              d.instanceOf('ca'),
            ),
            // with title same as name, it should inherit from the instance
            kubernetesNamespace('keycloak1', { title: 'keycloak1' }).with(
              d.instanceOf('identity'),
            ),
            // with title same as name, but expanded (do not inherit)
            kubernetesNamespace('keycloak2', { title: 'keycloak2' }).with(
              d.instanceOf('identity'),
            ),
            // with title, it should use the title
            kubernetesNamespace('keycloak3', { title: 'Keycloak' }).with(
              d.instanceOf('identity'),
            ),
          )
        ),
    )

    const nodes = indexBy(
      t.computeView(
        t.$include('*'),
        t.$include('cert_manager.*'),
        t.$include('keycloak2.*'),
      ).nodes,
      n => n.id as string,
    )

    expect(nodes).toMatchObject({
      'cert_manager': {
        title: 'cert-manager',
      },
      'keycloak1': {
        title: 'Identity Provider',
      },
      'keycloak2': {
        title: 'keycloak2',
      },
      'keycloak3': {
        title: 'Keycloak',
      },
    })
  })
})
