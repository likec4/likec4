import { omit } from 'remeda'
import { describe, expect, it } from 'vitest'
import { DeploymentConnectionModel, findConnection } from '../../../model/connection/deployment'
import { DeploymentRelationModel, RelationshipsAccum } from '../../../model/DeploymentElementModel'
import type { RelationshipModel } from '../../../model/RelationModel'
import type { AnyAux } from '../../../model/types'
import { createModel } from '../__test__/fixture'
import { Memory } from '../_types'
import { StageInclude } from './stage-include'

describe('stage-include', () => {
  describe('addExplicit', () => {
    it('should add element to explicit, elements and final collections', () => {
      const memory = Memory.empty()
      const model = createModel()
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const stage = new StageInclude(memory, { wildcard: true })

      stage.addExplicit(ui)

      const result = toReadableMemory(stage.commit())

      expect(result).toMatchInlineSnapshot(`
        {
          "connections": [],
          "elements": [
            "prod.eu.zone1.ui",
          ],
          "explicits": [
            "prod.eu.zone1.ui",
          ],
          "final": [
            "prod.eu.zone1.ui",
          ],
        }
      `)
    })

    it('should convert explicit elements into explicit', () => {
      const model = createModel()
      const memory = Memory.empty()
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const stage = new StageInclude(memory, { wildcard: true })
      stage.addImplicit(ui)

      stage.addExplicit(ui)

      const result = toReadableMemory(stage.commit())

      expect(result).toMatchInlineSnapshot(`
          {
            "connections": [],
            "elements": [
              "prod.eu.zone1.ui",
            ],
            "explicits": [
              "prod.eu.zone1.ui",
            ],
            "final": [
              "prod.eu.zone1.ui",
            ],
          }
        `)
    })
  })

  describe('addImplicit', () => {
    it('should add to elements collections (resolvable, but not visible)', () => {
      const model = createModel()
      const memory = Memory.empty()
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const stage = new StageInclude(memory, { wildcard: true })

      stage.addImplicit(ui)

      const result = toReadableMemory(stage.commit())

      expect(result).toMatchInlineSnapshot(`
          {
            "connections": [],
            "elements": [
              "prod.eu.zone1.ui",
            ],
            "explicits": [],
            "final": [],
          }
        `)
    })

    it('should keep element explicit if it was explicit before', () => {
      const model = createModel()
      const memory = Memory.empty()
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const stage = new StageInclude(memory, { wildcard: true })
      stage.addExplicit(ui)
      stage.addImplicit(ui)

      const result = toReadableMemory(stage.commit())

      expect(result).toMatchInlineSnapshot(`
            {
              "connections": [],
              "elements": [
                "prod.eu.zone1.ui",
              ],
              "explicits": [
                "prod.eu.zone1.ui",
              ],
              "final": [
                "prod.eu.zone1.ui",
              ],
            }
          `)
    })
  })

  describe('addConnections', () => {
    it('should add to connections', () => {
      const model = createModel()
      const memory = Memory.empty()
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const api = model.deployment.element('prod.eu.zone1.api')
      const stage = new StageInclude(memory, { wildcard: true })

      stage.addConnections(findConnection(ui, api))

      const { connections } = toReadableMemory(stage.commit())

      expect(connections).toMatchInlineSnapshot(`
        [
          {
            "name": "prod.eu.zone1.ui:prod.eu.zone1.api",
            "relations": {
              "deployment": [],
              "model": [
                "cloud.frontend.dashboard:cloud.backend.api",
              ],
            },
          },
        ]
      `)
    })

    it('should add endpoints as implicits (visible and resolvable)', () => {
      const model = createModel()
      const memory = Memory.empty()
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const api = model.deployment.element('prod.eu.zone1.api')
      const stage = new StageInclude(memory, { wildcard: true })

      stage.addConnections(findConnection(ui, api))

      const result = toReadableMemory(stage.commit())

      // TODO: Does not cover the content of the #implicit field. On patch required elements
      // are added to the 'elements' colection from the connection itself.
      expect(omit(result, ['connections'])).toMatchInlineSnapshot(`
        {
          "elements": [
            "prod.eu.zone1.ui",
            "prod.eu.zone1.api",
            "prod.eu.zone1",
          ],
          "explicits": [],
          "final": [
            "prod.eu.zone1.ui",
            "prod.eu.zone1.api",
          ],
        }
      `)
    })

    it('should merge relations if connection was staged before', () => {
      const model = createModel()
      const memory = Memory.empty()
      const customer = model.deployment.element('dev.devCustomer')
      const cloud = model.deployment.element('dev.devCloud')
      const stage = new StageInclude(memory, { wildcard: true })
      const connection = findConnection(customer, cloud)[0]!
      const connectionPart1 = sliceConnection(connection, r => r.target.id == 'cloud')
      stage.addConnections([connectionPart1])
      const connectionPart2 = sliceConnection(connection, r => r.target.id == 'cloud.frontend.mobile')
      stage.addConnections([connectionPart2])

      const { connections } = toReadableMemory(stage.commit())

      expect(connections).toMatchInlineSnapshot(`
        [
          {
            "name": "dev.devCustomer:dev.devCloud",
            "relations": {
              "deployment": [],
              "model": [
                "customer:cloud.frontend.mobile",
                "customer:cloud",
              ],
            },
          },
        ]
      `)
    })
  })

  describe('commit', () => {
    it('should extend final with added explicits and endpoints of added connections', () => {
      const model = createModel()
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const api = model.deployment.element('prod.eu.zone1.api')
      const email = model.deployment.element('global.email')
      const customer = model.deployment.element('customer')
      const auth = model.deployment.element('prod.eu.auth')

      const memory = Memory.empty().update({
        elements: new Set([ui]),
        final: new Set([ui]),
      })
      const stage = new StageInclude(memory, { wildcard: true })
      stage.addExplicit(api)
      stage.addImplicit(auth)
      stage.addConnections(findConnection(email, customer))

      const { final } = toReadableMemory(stage.commit())

      expect(final).toMatchInlineSnapshot(`
        [
          "prod.eu.zone1.ui",
          "prod.eu.zone1.api",
          "global.email",
          "customer",
        ]
      `)
    })

    it('should extend explicits with added explicits', () => {
      const model = createModel()
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const api = model.deployment.element('prod.eu.zone1.api')
      const email = model.deployment.element('global.email')
      const customer = model.deployment.element('customer')
      const auth = model.deployment.element('prod.eu.auth')

      const memory = Memory.empty().update({
        elements: new Set([ui]),
        explicits: new Set([ui]),
      })
      const stage = new StageInclude(memory, { wildcard: true })
      stage.addExplicit(api)
      stage.addImplicit(auth)
      stage.addConnections(findConnection(email, customer))

      const { explicits } = toReadableMemory(stage.commit())

      expect(explicits).toMatchInlineSnapshot(`
        [
          "prod.eu.zone1.ui",
          "prod.eu.zone1.api",
        ]
      `)
    })

    it('should extend elements with added explicits, implicits and endpoints of added connections', () => {
      const model = createModel()
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const api = model.deployment.element('prod.eu.zone1.api')
      const email = model.deployment.element('global.email')
      const customer = model.deployment.element('customer')
      const auth = model.deployment.element('prod.eu.auth')

      const memory = Memory.empty().update({
        elements: new Set([ui]),
      })
      const stage = new StageInclude(memory, { wildcard: true })
      stage.addExplicit(api)
      stage.addImplicit(auth)
      stage.addConnections(findConnection(email, customer))

      const { elements } = toReadableMemory(stage.commit())

      expect(elements).toMatchInlineSnapshot(`
        [
          "prod.eu.zone1.ui",
          "prod.eu.zone1.api",
          "prod.eu.auth",
          "global.email",
          "customer",
        ]
      `)
    })

    it('should merge relations of matching staged and existing connections', () => {
      const model = createModel()
      const customer = model.deployment.element('dev.devCustomer')
      const cloud = model.deployment.element('dev.devCloud')
      const memory1 = Memory.empty()
      const stage1 = new StageInclude(memory1, { wildcard: true })
      const connection = findConnection(customer, cloud)[0]!
      const connectionPart1 = sliceConnection(connection, r => r.target.id == 'cloud')
      stage1.addConnections([connectionPart1])

      const memory2 = stage1.commit()
      const stage2 = new StageInclude(memory2, { wildcard: true })
      const connectionPart2 = sliceConnection(connection, r => r.target.id == 'cloud.frontend.mobile')
      stage2.addConnections([connectionPart2])

      const { connections } = toReadableMemory(stage2.commit())

      expect(connections).toMatchInlineSnapshot(`
        [
          {
            "name": "dev.devCustomer:dev.devCloud",
            "relations": {
              "deployment": [],
              "model": [
                "customer:cloud.frontend.mobile",
                "customer:cloud",
              ],
            },
          },
        ]
      `)
    })

    it('should keep order of existing connections', () => {
      const model = createModel()
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const api = model.deployment.element('prod.eu.zone1.api')
      const customer = model.deployment.element('customer')
      const auth = model.deployment.element('prod.eu.auth')

      const memory1 = Memory.empty()
      const stage1 = new StageInclude(memory1, { wildcard: true })
      stage1.addConnections(findConnection(ui, api))
      stage1.addConnections(findConnection(api, auth))

      const memory2 = stage1.commit()
      const stage2 = new StageInclude(memory2, { wildcard: true })
      stage2.addConnections(findConnection(customer, ui)) // other
      stage2.addConnections(findConnection(api, auth)) // existing
      stage2.addConnections(findConnection(ui, api)) // existing

      const { connections } = toReadableMemory(stage2.commit())

      expect(connections.map(c => c.name).slice(0, 2)).toMatchInlineSnapshot(`
        [
          "prod.eu.zone1.ui:prod.eu.zone1.api",
          "prod.eu.zone1.api:prod.eu.auth",
        ]
      `)
    })

    it('should place outgoing connections from existing elements after existing connections and before others', () => {
      const model = createModel()
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const api = model.deployment.element('prod.eu.zone1.api')
      const customer = model.deployment.element('customer')
      const auth = model.deployment.element('prod.eu.auth')
      const email = model.deployment.element('global.email')

      const memory1 = Memory.empty()
      const stage1 = new StageInclude(memory1, { wildcard: true })
      stage1.addConnections(findConnection(ui, api)) // existing

      const memory2 = stage1.commit()
      const stage2 = new StageInclude(memory2, { wildcard: true })
      stage2.addConnections(findConnection(email, customer)) // other
      stage2.addConnections(findConnection(customer, ui)) // other
      stage2.addConnections(findConnection(api, auth)) // outgoing from existing element

      const { connections } = toReadableMemory(stage2.commit())

      expect(connections.map(c => c.name)).toMatchInlineSnapshot(`
        [
          "prod.eu.zone1.ui:prod.eu.zone1.api",
          "prod.eu.zone1.api:prod.eu.auth",
          "global.email:customer",
          "customer:prod.eu.zone1.ui",
        ]
      `)
    })
  })
})

function toReadableMemory(memory: Memory) {
  return {
    connections: memory.connections.map(c => ({
      name: `${c.source.id}:${c.target.id}`,
      relations: {
        deployment: [...c.relations.deployment].map(r => `${r.source.id}:${r.target.id}`),
        model: [...c.relations.model].map(r => `${r.source.id}:${r.target.id}`),
      },
    })),
    elements: [...memory.elements].map(e => `${e.id}`),
    explicits: [...memory.explicits].map(e => `${e.id}`),
    final: [...memory.final].map(e => `${e.id}`),
  }
}

function sliceConnection<M extends AnyAux>(
  connection: DeploymentConnectionModel<M>,
  modelPredicate: ((r: RelationshipModel<M>) => boolean) | null = null,
  deploymentPredicate: ((r: DeploymentRelationModel<M>) => boolean) | null = null,
): DeploymentConnectionModel<any> {
  return new DeploymentConnectionModel<M>(
    connection.source,
    connection.target,
    new RelationshipsAccum(
      new Set([...connection.relations.model].filter(modelPredicate ?? (() => true))),
      new Set([...connection.relations.deployment].filter(deploymentPredicate ?? (() => true))),
    ),
  )
}
