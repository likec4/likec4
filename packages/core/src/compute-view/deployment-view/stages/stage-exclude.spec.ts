import { omit } from 'remeda'
import { describe, expect, it } from 'vitest'
import { DeploymentConnectionModel, findConnection } from '../../../model/connection/deployment'
import { DeploymentRelationModel, RelationshipsAccum } from '../../../model/DeploymentElementModel'
import type { RelationshipModel } from '../../../model/RelationModel'
import type { AnyAux } from '../../../model/types'
import { createModel } from '../__test__/fixture'
import { StageExclude } from './stage-exclude'
import { Memory, StageInclude } from '../memory'

describe('Stage', () => {
  describe('exclude', () => {
    it('should exclude staged implicit element without connections', () => {
      const model = createModel()
      const baseMemory = Memory.empty()
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const baseStage = new StageInclude(baseMemory, {wildcard: true})
      baseStage.addImplicit(ui)

      const memory = baseStage.commit()
      const stage = new StageExclude(memory, {wildcard: true})
      stage.exclude(ui)

      const result = toReadableMemory(stage.commit())

      expect(result).toMatchInlineSnapshot(`
        {
          "connections": [],
          "elements": [],
          "explicits": [],
          "final": [],
        }
      `)
    })

    it('should exclude staged explicit element without connections', () => {
      const model = createModel()
      const baseMemory = Memory.empty()
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const baseStage = new StageInclude(baseMemory, {wildcard: true})

      baseStage.addExplicit(ui)

      const memory = baseStage.commit()
      const stage = new StageExclude(memory, {wildcard: true})
      stage.exclude(ui)

      const result = toReadableMemory(stage.commit())

      expect(result).toMatchInlineSnapshot(`
        {
          "connections": [],
          "elements": [],
          "explicits": [],
          "final": [],
        }
      `)
    })

    it('should remove element and all its connections', () => {
      const model = createModel()
      const baseMemory = Memory.empty()
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const api = model.deployment.element('prod.eu.zone1.api')
      const baseStage = new StageInclude(baseMemory, {wildcard: true})

      baseStage.addExplicit(ui)
      baseStage.addImplicit(api)
      baseStage.addConnections(findConnection(ui, api))

      const memory = baseStage.commit()
      const stage = new StageExclude(memory, {wildcard: true})
      stage.exclude([ui, api])

      const result = toReadableMemory(stage.commit())

      expect(result).toMatchInlineSnapshot(`
        {
          "connections": [],
          "elements": [],
          "explicits": [],
          "final": [],
        }
      `)
    })
  })

  describe('excludeConnections', () => {
    it('should exclude staged connections', () => {
      const model = createModel()
      const baseMemory = Memory.empty()
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const api = model.deployment.element('prod.eu.zone1.api')
      const baseStage = new StageInclude(baseMemory, {wildcard: true})
      const connectionToExclude = findConnection(ui, api)
      baseStage.addConnections(connectionToExclude)

      const memory = baseStage.commit()
      const stage = new StageExclude(memory, {wildcard: true})
      stage.excludeConnections(findConnection(ui, api))

      const { connections } = toReadableMemory(stage.commit())

      expect(connections).toMatchInlineSnapshot(`[]`)
    })
  })

  describe('patch', () => {
    it('should remove excluded elements', () => {
      const model = createModel()
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const api = model.deployment.element('prod.eu.zone1.api')
      const connection = findConnection(ui, api)

      const memory = Memory.empty().update({
        elements: new Set([ui, api]), 
        final: new Set([ui, api]),
        connections: [...connection]
      })      
      const stage = new StageExclude(memory, {wildcard: true})
      stage.exclude(ui)

      const result = omit(toReadableMemory(stage.commit()), ['connections'])

      expect(result).toMatchInlineSnapshot(`
        {
          "elements": [
            "prod.eu.zone1.api",
          ],
          "explicits": [],
          "final": [
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

      const memory = Memory.empty().update({
        elements: new Set([ui, api, auth]), 
        final: new Set([ui, api, auth]),
        connections: [...connectionToExclude, ...connectionToKeep]
      })
      const stage = new StageExclude(memory, {wildcard: true})
      stage.excludeConnections(connectionToExclude)

      const { connections } = toReadableMemory(stage.commit())

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

    it('should remove excluded connections', () => {
      const model = createModel()
      const ui = model.deployment.element('prod.eu.zone1.ui')
      const api = model.deployment.element('prod.eu.zone1.api')
      const auth = model.deployment.element('prod.eu.auth')

      const memory1 = Memory.empty()
      const stage1 = new StageInclude(memory1, { wildcard: true })
      stage1.addConnections(findConnection(ui, api))
      stage1.addConnections(findConnection(api, auth))

      const memory2 = stage1.commit()
      const stage2 = new StageExclude(memory2, { wildcard: true })
      stage2.excludeConnections(findConnection(api, auth))

      const { connections } = toReadableMemory(stage2.commit())

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

      const memory1 = Memory.empty()
      const stage1 = new StageInclude(memory1, { wildcard: true })
      stage1.addConnections(findConnection(customer, cloud))

      const memory2 = stage1.commit()
      const stage2 = new StageExclude(memory2, { wildcard: true })
      const partialConnection = sliceConnection(
        findConnection(customer, cloud)[0]!,
        r => r.target.id == 'cloud.frontend.mobile'
      )
      stage2.excludeConnections([partialConnection])

      const { connections } = toReadableMemory(stage2.commit())

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

      const memory1 = Memory.empty()
      const stage1 = new StageInclude(memory1, { wildcard: true })
      stage1.addConnections(findConnection(customer, cloud))

      const memory2 = stage1.commit()
      const stage2 = new StageExclude(memory2, { wildcard: true })
      const partialConnection1 = sliceConnection(
        findConnection(customer, cloud)[0]!,
        r => r.target.id == 'cloud.frontend.mobile'
      )
      const partialConnection2 = sliceConnection(
        findConnection(customer, cloud)[0]!,
        r => r.target.id == 'cloud.frontend.dashboard'
      )
      stage2.excludeConnections([partialConnection1, partialConnection2])

      const { connections } = toReadableMemory(stage2.commit())

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

function toReadableMemory(memory: Memory) {
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
    final: [...memory.final].map(e => `${e.id}`)
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
