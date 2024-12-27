import { omit } from 'remeda'
import { describe, expect, it } from 'vitest'
import { findConnection } from '../../model/connection/deployment'
import { DeploymentConnectionModel } from '../../model/connection/DeploymentConnectionModel'
import { DeploymentRelationModel, RelationshipsAccum } from '../../model/DeploymentElementModel'
import type { RelationshipModel } from '../../model/RelationModel'
import type { AnyAux } from '../../model/types'
import { createModel } from './__test__/fixture'
import type { Elem } from './_types'
import { MutableMemory } from './Memory'
import { Stage } from './Stage'

describe('Stage', () => {
  describe('addExplicit', () => {
    it('should add element to explicit, elements and finalElements collections', () => {
      const model = createModel()
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const stage = new Stage()

      stage.addExplicit(ui)

      const result = toReadableMemory(stage.patch()(MutableMemory.empty()) as MutableMemory)

      expect(result).toMatchInlineSnapshot(`
        {
          "connections": [],
          "elements": [
            "prod.eu.zone1.ui",
          ],
          "explicits": [
            "prod.eu.zone1.ui",
          ],
          "finalElements": [
            "prod.eu.zone1.ui",
          ],
        }
      `)
    })

    it('should convert explicit elements into explicit', () => {
      const model = createModel()
      const memory = new MutableMemory(
        new Set<Elem>(),
        new Set<Elem>(),
        new Array<DeploymentConnectionModel>(),
        new Set<Elem>()
      )
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const stage = new Stage()
      stage.addImplicit(ui)

      stage.addExplicit(ui)

      const result = toReadableMemory(stage.patch()(memory) as MutableMemory)

      expect(result).toMatchInlineSnapshot(`
          {
            "connections": [],
            "elements": [
              "prod.eu.zone1.ui",
            ],
            "explicits": [
              "prod.eu.zone1.ui",
            ],
            "finalElements": [
              "prod.eu.zone1.ui",
            ],
          }
        `)
    })
  })

  describe('addImplicit', () => {
    it('should add to elements collections (resolvable, but not visible)', () => {
      const model = createModel()
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const stage = new Stage()

      stage.addImplicit(ui)

      const result = toReadableMemory(stage.patch()(MutableMemory.empty()) as MutableMemory)

      expect(result).toMatchInlineSnapshot(`
          {
            "connections": [],
            "elements": [
              "prod.eu.zone1.ui",
            ],
            "explicits": [],
            "finalElements": [],
          }
        `)
    })

    it('should keep element explicit if it was explicit before', () => {
      const model = createModel()
      const memory = new MutableMemory(
        new Set<Elem>(),
        new Set<Elem>(),
        new Array<DeploymentConnectionModel>(),
        new Set<Elem>()
      )
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const stage = new Stage()
      stage.addExplicit(ui)
      stage.addImplicit(ui)

      const result = toReadableMemory(stage.patch()(memory) as MutableMemory)

      expect(result).toMatchInlineSnapshot(`
            {
              "connections": [],
              "elements": [
                "prod.eu.zone1.ui",
              ],
              "explicits": [
                "prod.eu.zone1.ui",
              ],
              "finalElements": [
                "prod.eu.zone1.ui",
              ],
            }
          `)
    })
  })
  describe('addConnections', () => {
    it('should add to connections', () => {
      const model = createModel()
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const api = model.deployment.element('prod.eu.zone1.api')
      const stage = new Stage()

      stage.addConnections(findConnection(ui, api))

      const { connections } = toReadableMemory(stage.patch()(MutableMemory.empty()) as MutableMemory)

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
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const api = model.deployment.element('prod.eu.zone1.api')
      const stage = new Stage()

      stage.addConnections(findConnection(ui, api))

      const result = toReadableMemory(stage.patch()(MutableMemory.empty()) as MutableMemory)

      // TODO: Does not cover the content of the #implicit field. On patch required elements 
      // are added to the 'elements' colection from the connection itself.
      expect(omit(result, ['connections'])).toMatchInlineSnapshot(`
        {
          "elements": [
            "prod.eu.zone1.ui",
            "prod.eu.zone1.api",
          ],
          "explicits": [],
          "finalElements": [
            "prod.eu.zone1.ui",
            "prod.eu.zone1.api",
          ],
        }
      `)
    })

    it('should merge relations if connection was staged before', () => {
      const model = createModel()
      const customer = model.deployment.element('dev.devCustomer')
      const cloud = model.deployment.element('dev.devCloud')
      const stage = new Stage()
      const connection = findConnection(customer, cloud)[0]!
      const connectionPart1 = sliceConnection(connection, r => r.target.id == 'cloud')
      stage.addConnections([connectionPart1])
      const connectionPart2 = sliceConnection(connection, r => r.target.id == 'cloud.frontend.mobile')
      stage.addConnections([connectionPart2])

      const { connections } = toReadableMemory(stage.patch()(MutableMemory.empty()) as MutableMemory)

      expect(connections).toMatchInlineSnapshot(`
        [
          {
            "name": "dev.devCustomer:dev.devCloud",
            "relations": {
              "deployment": [],
              "model": [
                "customer:cloud",
                "customer:cloud.frontend.mobile",
              ],
            },
          },
        ]
      `)
    })
  })

  describe('exclude', () => {
    it('should exclude staged implicit element without connections', () => {
      const model = createModel()
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const stage = new Stage()

      stage.addImplicit(ui)
      stage.exclude(ui)

      const result = toReadableMemory(stage.patch()(MutableMemory.empty()) as MutableMemory)

      expect(result).toMatchInlineSnapshot(`
        {
          "connections": [],
          "elements": [],
          "explicits": [],
          "finalElements": [],
        }
      `)
    })

    it('should exclude staged explicit element without connections', () => {
      const model = createModel()
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const stage = new Stage()

      stage.addExplicit(ui)
      stage.exclude(ui)

      const result = toReadableMemory(stage.patch()(MutableMemory.empty()) as MutableMemory)

      expect(result).toMatchInlineSnapshot(`
        {
          "connections": [],
          "elements": [],
          "explicits": [],
          "finalElements": [],
        }
      `)
    })

    it('should remove element and all its connections', () => {
      const model = createModel()
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const api = model.deployment.element('prod.eu.zone1.api')
      const stage = new Stage()

      stage.addExplicit(ui)
      stage.addImplicit(api)
      stage.addConnections(findConnection(ui, api))
      stage.exclude([ui, api])

      const result = toReadableMemory(stage.patch()(MutableMemory.empty()) as MutableMemory)

      expect(result).toMatchInlineSnapshot(`
        {
          "connections": [],
          "elements": [],
          "explicits": [],
          "finalElements": [],
        }
      `)
    })
  })

  describe('excludeConnections', () => {
    it('should exclude staged connections', () => {
      const model = createModel()
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const api = model.deployment.element('prod.eu.zone1.api')
      const stage = new Stage()
      const connectionToExclude = findConnection(ui, api)
      stage.addConnections(connectionToExclude)

      stage.excludeConnections(findConnection(ui, api))

      const { connections } = toReadableMemory(stage.patch()(MutableMemory.empty()) as MutableMemory)

      expect(connections).toMatchInlineSnapshot(`[]`)
    })
  })

  describe('patch', () => {
    it('should remove excluded elements', () => {
      const model = createModel()
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const api = model.deployment.element('prod.eu.zone1.api')
      const connection = findConnection(ui, api)

      const memory = MutableMemory.empty() as MutableMemory
      memory.elements.add(ui)
      memory.elements.add(api)
      memory.finalElements.add(ui)
      memory.finalElements.add(api)
      memory.connections.push(...connection)
      const stage = new Stage()
      stage.exclude(ui)

      const result = omit(toReadableMemory(stage.patch()(memory) as MutableMemory), ['connections'])

      expect(result).toMatchInlineSnapshot(`
        {
          "elements": [
            "prod.eu.zone1.api",
          ],
          "explicits": [],
          "finalElements": [
            "prod.eu.zone1.api",
          ],
        }
      `)
    })

    it('should remove existing relations with excluded elements', () => {
      const model = createModel()
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const api = model.deployment.element('prod.eu.zone1.api')
      const auth = model.deployment.element('prod.eu.auth')
      const connectionToExclude = findConnection(ui, api)
      const connectionToKeep = findConnection(api, auth)

      const memory = MutableMemory.empty() as MutableMemory
      memory.elements.add(ui)
      memory.elements.add(api)
      memory.elements.add(auth)
      memory.finalElements.add(ui)
      memory.finalElements.add(api)
      memory.finalElements.add(auth)
      memory.connections.push(...connectionToExclude)
      memory.connections.push(...connectionToKeep)
      const stage = new Stage()
      stage.excludeConnections(connectionToExclude)

      const { connections } = toReadableMemory(stage.patch()(memory) as MutableMemory)

      expect(connections).toMatchInlineSnapshot(`
        [
          {
            "name": "prod.eu.zone1.api:prod.eu.auth",
            "relations": {
              "deployment": [],
              "model": [
                "cloud.backend.api:cloud.auth",
              ],
            },
          },
        ]
      `)
    })

    it('should extend finalElements with added explicits and endpoints of added connections', () => {
      const model = createModel()
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const api = model.deployment.element('prod.eu.zone1.api')
      const email = model.deployment.element('global.email')
      const customer = model.deployment.element('customer')
      const auth = model.deployment.element('prod.eu.auth')

      const memory = MutableMemory.empty() as MutableMemory
      memory.finalElements.add(ui)
      const stage = new Stage()
      stage.addExplicit(api)
      stage.addImplicit(auth)
      stage.addConnections(findConnection(email, customer))

      const { finalElements } = toReadableMemory(stage.patch()(memory) as MutableMemory)

      expect(finalElements).toMatchInlineSnapshot(`
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

      const memory = MutableMemory.empty() as MutableMemory
      memory.explicits.add(ui)
      const stage = new Stage()
      stage.addExplicit(api)
      stage.addImplicit(auth)
      stage.addConnections(findConnection(email, customer))

      const { explicits } = toReadableMemory(stage.patch()(memory) as MutableMemory)

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

      const memory = MutableMemory.empty() as MutableMemory
      memory.elements.add(ui)
      const stage = new Stage()
      stage.addExplicit(api)
      stage.addImplicit(auth)
      stage.addConnections(findConnection(email, customer))

      const { elements } = toReadableMemory(stage.patch()(memory) as MutableMemory)

      expect(elements).toMatchInlineSnapshot(`
        [
          "prod.eu.zone1.ui",
          "prod.eu.zone1.api",
          "global.email",
          "customer",
          "prod.eu.auth",
        ]
      `)
    })

    it('should merge relations of matching staged and existing connections', () => {
      const model = createModel()
      const customer = model.deployment.element('dev.devCustomer')
      const cloud = model.deployment.element('dev.devCloud')
      const memory1 = MutableMemory.empty()
      const stage1 = new Stage()
      const connection = findConnection(customer, cloud)[0]!
      const connectionPart1 = sliceConnection(connection, r => r.target.id == 'cloud')
      stage1.addConnections([connectionPart1])

      const memory2 = stage1.patch()(memory1)
      const stage2 = new Stage()
      const connectionPart2 = sliceConnection(connection, r => r.target.id == 'cloud.frontend.mobile')
      stage2.addConnections([connectionPart2])

      const { connections } = toReadableMemory(stage2.patch()(memory2) as MutableMemory)

      expect(connections).toMatchInlineSnapshot(`
        [
          {
            "name": "dev.devCustomer:dev.devCloud",
            "relations": {
              "deployment": [],
              "model": [
                "customer:cloud",
                "customer:cloud.frontend.mobile",
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

      const memory1 = MutableMemory.empty() as MutableMemory
      const stage1 = new Stage()
      stage1.addConnections(findConnection(ui, api))
      stage1.addConnections(findConnection(api, auth))

      const memory2 = stage1.patch()(memory1)
      const stage2 = new Stage()
      stage2.addConnections(findConnection(customer, ui)) // other
      stage2.addConnections(findConnection(api, auth)) // existing
      stage2.addConnections(findConnection(ui, api)) // existing

      const { connections } = toReadableMemory(stage2.patch()(memory2) as MutableMemory)

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

      const memory1 = MutableMemory.empty() as MutableMemory
      const stage1 = new Stage()
      stage1.addConnections(findConnection(ui, api)) // existing

      const memory2 = stage1.patch()(memory1)
      const stage2 = new Stage()
      stage2.addConnections(findConnection(email, customer)) // other
      stage2.addConnections(findConnection(customer, ui)) // other
      stage2.addConnections(findConnection(api, auth)) // outgoing from existing element

      const { connections } = toReadableMemory(stage2.patch()(memory2) as MutableMemory)

      expect(connections.map(c => c.name)).toMatchInlineSnapshot(`
        [
          "prod.eu.zone1.ui:prod.eu.zone1.api",
          "prod.eu.zone1.api:prod.eu.auth",
          "global.email:customer",
          "customer:prod.eu.zone1.ui",
        ]
      `)
    })

    it('should remove excluded connections', () => {
      const model = createModel()
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const api = model.deployment.element('prod.eu.zone1.api')
      const auth = model.deployment.element('prod.eu.auth')

      const memory1 = MutableMemory.empty() as MutableMemory
      const stage1 = new Stage()
      stage1.addConnections(findConnection(ui, api))
      stage1.addConnections(findConnection(api, auth))

      const memory2 = stage1.patch()(memory1)
      const stage2 = new Stage()
      stage2.excludeConnections(findConnection(api, auth))

      const { connections } = toReadableMemory(stage2.patch()(memory2) as MutableMemory)

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

    it('should keep connection if only some relations are excluded', () => {
      const model = createModel()
      const customer = model.deployment.element('dev.devCustomer')
      const cloud = model.deployment.element('dev.devCloud')

      const memory1 = MutableMemory.empty() as MutableMemory
      const stage1 = new Stage()
      stage1.addConnections(findConnection(customer, cloud))

      const memory2 = stage1.patch()(memory1)
      const stage2 = new Stage()
      const partialConnection = sliceConnection(
        findConnection(customer, cloud)[0]!,
        r => r.target.id == 'cloud.frontend.mobile'
      )
      stage2.excludeConnections([partialConnection])

      const { connections } = toReadableMemory(stage2.patch()(memory2) as MutableMemory)

      expect(connections).toMatchInlineSnapshot(`
        [
          {
            "name": "dev.devCustomer:dev.devCloud",
            "relations": {
              "deployment": [],
              "model": [
                "customer:cloud",
                "customer:cloud.frontend.dashboard",
              ],
            },
          },
        ]
      `)
    })

    it('should handle multiple exclusions of the same connection', () => {
      const model = createModel()
      const customer = model.deployment.element('dev.devCustomer')
      const cloud = model.deployment.element('dev.devCloud')

      const memory1 = MutableMemory.empty() as MutableMemory
      const stage1 = new Stage()
      stage1.addConnections(findConnection(customer, cloud))

      const memory2 = stage1.patch()(memory1)
      const stage2 = new Stage()
      const partialConnection1 = sliceConnection(
        findConnection(customer, cloud)[0]!,
        r => r.target.id == 'cloud.frontend.mobile'
      )
      const partialConnection2 = sliceConnection(
        findConnection(customer, cloud)[0]!,
        r => r.target.id == 'cloud.frontend.dashboard'
      )
      stage2.excludeConnections([partialConnection1, partialConnection2])

      const { connections } = toReadableMemory(stage2.patch()(memory2) as MutableMemory)

      expect(connections).toMatchInlineSnapshot(`
        [
          {
            "name": "dev.devCustomer:dev.devCloud",
            "relations": {
              "deployment": [],
              "model": [
                "customer:cloud",
              ],
            },
          },
        ]
      `)
    })
  })
})

function toReadableMemory(memory: MutableMemory) {
  return {
    connections: memory.connections.map(c => ({
      name: `${c.source.id}:${c.target.id}`,
      relations: {
        deployment: [...c.relations.deployment].map(r => `${r.source.id}:${r.target.id}`),
        model: [...c.relations.model].map(r => `${r.source.id}:${r.target.id}`)
      }
    })),
    elements: [...memory.elements].map(e => `${e.id}`),
    explicits: [...memory.explicits].map(e => `${e.id}`),
    finalElements: [...memory.finalElements].map(e => `${e.id}`)
  }
}

function sliceConnection<M extends AnyAux>(
  connection: DeploymentConnectionModel<M>,
  modelPredicate: ((r: RelationshipModel<M>) => boolean) | null = null,
  deploymentPredicate: ((r: DeploymentRelationModel<M>) => boolean) | null = null
): DeploymentConnectionModel<any> {
  return new DeploymentConnectionModel<M>(
    connection.source,
    connection.target,
    new RelationshipsAccum(
      new Set([...connection.relations.model].filter(modelPredicate ?? (() => true))),
      new Set([...connection.relations.deployment].filter(deploymentPredicate ?? (() => true)))
    )
  )
}
