import { describe, expect, it } from 'vitest'
import { findConnection } from '../../model/connection/deployment'
import { DeploymentConnectionModel } from '../../model/connection/DeploymentConnectionModel'
import { createModel } from './__test__/fixture'
import type { Elem } from './_types'
import { MutableMemory } from './Memory'

describe('Memory', () => {
  describe('excludeConnections', () => {
    it('should return copy of memory', () => {
      const model = createModel()
      const memory = new MutableMemory(
        new Set<Elem>(),
        new Set<Elem>(),
        new Array<DeploymentConnectionModel>(),
        new Set<Elem>()
      )

      const copy = memory.excludeConnections(findConnection(
        model.deployment.element('customer'),
        model.deployment.element('prod.eu.zone1.ui')
      ))

      expect(memory === copy).toBeFalsy()
      expect(memory).toEqual(copy)
    })

    it('should remove excluded connections', () => {
      const model = createModel()
      const memory = new MutableMemory(
        new Set<Elem>(),
        new Set<Elem>(),
        new Array<DeploymentConnectionModel>(),
        new Set<Elem>()
      )
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const api = model.deployment.element('prod.eu.zone1.api')
      const auth = model.deployment.element('prod.eu.auth')
      const connectionToExclude = findConnection(ui, api)
      const connectionToKeep = findConnection(api, auth)
      memory.connections.push(...connectionToExclude, ...connectionToKeep)

      const { connections } = toReadableMemory(memory.excludeConnections(connectionToExclude))

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

    it('should remove elements referenced only by excluded connections', () => {
      const model = createModel()
      const memory = new MutableMemory(
        new Set<Elem>(),
        new Set<Elem>(),
        new Array<DeploymentConnectionModel>(),
        new Set<Elem>()
      )
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const api = model.deployment.element('prod.eu.zone1.api')
      const auth = model.deployment.element('prod.eu.auth')
      const connectionToExclude = findConnection(ui, api)
      const connectionToKeep = findConnection(api, auth)
      memory.elements.add(ui)
      memory.elements.add(api)
      memory.elements.add(auth)
      memory.connections.push(...connectionToExclude, ...connectionToKeep)

      const { elements } = toReadableMemory(memory.excludeConnections(connectionToExclude))

      expect(elements).toMatchInlineSnapshot(`
        [
          "prod.eu.zone1.api",
          "prod.eu.auth",
        ]
      `)
    })

    it('should not remove explicit elements referenced only by excluded connections', () => {
      const model = createModel()
      const memory = new MutableMemory(
        new Set<Elem>(),
        new Set<Elem>(),
        new Array<DeploymentConnectionModel>(),
        new Set<Elem>()
      )
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const api = model.deployment.element('prod.eu.zone1.api')
      const connectionToExclude = findConnection(ui, api)
      memory.elements.add(ui)
      memory.explicits.add(ui)
      memory.elements.add(api)
      memory.explicits.add(api)
      memory.connections.push(...connectionToExclude)

      const { elements } = toReadableMemory(memory.excludeConnections(connectionToExclude))

      expect(elements).toMatchInlineSnapshot(`
          [
            "prod.eu.zone1.ui",
            "prod.eu.zone1.api",
          ]
        `)
    })

    it('should convert explicit elements referenced only by excluded connections into implicits', () => {
      const model = createModel()
      const memory = new MutableMemory(
        new Set<Elem>(),
        new Set<Elem>(),
        new Array<DeploymentConnectionModel>(),
        new Set<Elem>()
      )
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const api = model.deployment.element('prod.eu.zone1.api')
      const connectionToExclude = findConnection(ui, api)
      memory.elements.add(ui)
      memory.explicits.add(ui)
      memory.elements.add(api)
      memory.explicits.add(api)
      memory.connections.push(...connectionToExclude)

      const { explicits, finalElements } = toReadableMemory(memory.excludeConnections(connectionToExclude))

      expect(explicits).toMatchInlineSnapshot(`[]`)
      expect(finalElements).toMatchInlineSnapshot(`[]`)
    })

    it('should hide elements referenced only by excluded connections', () => {
      const model = createModel()
      const memory = new MutableMemory(
        new Set<Elem>(),
        new Set<Elem>(),
        new Array<DeploymentConnectionModel>(),
        new Set<Elem>()
      )
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const api = model.deployment.element('prod.eu.zone1.api')
      const auth = model.deployment.element('prod.eu.auth')
      const db = model.deployment.element('prod.eu.db')
      const connectionToExclude1 = findConnection(ui, api)
      const connectionToExclude2 = findConnection(api, db)
      const connectionToKeep = findConnection(api, auth)
      memory.finalElements.add(ui)
      memory.finalElements.add(api)
      memory.finalElements.add(auth)
      memory.finalElements.add(db)
      memory.explicits.add(db)
      memory.connections.push(...connectionToExclude1, ...connectionToExclude2, ...connectionToKeep)

      const { finalElements } = toReadableMemory(
        memory
          .excludeConnections(connectionToExclude1)
          .excludeConnections(connectionToExclude2)
      )

      expect(finalElements).toMatchInlineSnapshot(`
        [
          "prod.eu.zone1.api",
          "prod.eu.auth",
        ]
      `)
    })
  })

  describe('exclude', () => {
    it('should return copy of memory', () => {
      const model = createModel()
      const memory = new MutableMemory(
        new Set<Elem>(),
        new Set<Elem>(),
        new Array<DeploymentConnectionModel>(),
        new Set<Elem>()
      )

      const copy = memory.exclude(new Set([model.deployment.element('customer')]))

      expect(memory === copy).toBeFalsy()
      expect(memory).toEqual(copy)
    })

    it('should remove all mentions of element', () => {
      const model = createModel()
      const memory = new MutableMemory(
        new Set<Elem>(),
        new Set<Elem>(),
        new Array<DeploymentConnectionModel>(),
        new Set<Elem>()
      )
      const api = model.deployment.element('prod.eu.zone1.api')
      const auth = model.deployment.element('prod.eu.auth')
      const connection = findConnection(api, auth)
      memory.elements.add(api)
      memory.explicits.add(api)
      memory.finalElements.add(api)
      memory.elements.add(auth)
      memory.explicits.add(auth)
      memory.finalElements.add(auth)
      memory.connections.push(...connection)

      const updated = toReadableMemory(memory.exclude(new Set([auth])))

      expect(updated).toMatchInlineSnapshot(`
          {
            "connections": [],
            "elements": [
              "prod.eu.zone1.api",
            ],
            "explicits": [
              "prod.eu.zone1.api",
            ],
            "finalElements": [
              "prod.eu.zone1.api",
            ],
          }
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
