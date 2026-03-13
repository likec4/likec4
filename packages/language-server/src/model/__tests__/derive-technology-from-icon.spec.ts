import { describe, expect, it } from 'vitest'
import { createTestServices } from '../../test'
import { deriveTechnologyFromIcon } from '../builder/MergedSpecification'

describe('deriveTechnologyFromIcon', () => {
  it('derives technology from tech: prefix', () => {
    expect(deriveTechnologyFromIcon('tech:apache-flink')).toBe('Apache Flink')
    expect(deriveTechnologyFromIcon('tech:react')).toBe('React')
    expect(deriveTechnologyFromIcon('tech:nodejs')).toBe('Nodejs')
    expect(deriveTechnologyFromIcon('tech:docker')).toBe('Docker')
  })

  it('derives technology from aws: prefix', () => {
    expect(deriveTechnologyFromIcon('aws:simple-storage-service')).toBe('Simple Storage Service')
    expect(deriveTechnologyFromIcon('aws:lambda')).toBe('Lambda')
    expect(deriveTechnologyFromIcon('aws:ec2')).toBe('Ec2')
  })

  it('derives technology from azure: prefix', () => {
    expect(deriveTechnologyFromIcon('azure:virtual-machine')).toBe('Virtual Machine')
    expect(deriveTechnologyFromIcon('azure:app-service')).toBe('App Service')
  })

  it('derives technology from gcp: prefix', () => {
    expect(deriveTechnologyFromIcon('gcp:compute-engine')).toBe('Compute Engine')
    expect(deriveTechnologyFromIcon('gcp:cloud-run')).toBe('Cloud Run')
  })

  it('strips -icon suffix', () => {
    expect(deriveTechnologyFromIcon('tech:codeclimate-icon')).toBe('Codeclimate')
    expect(deriveTechnologyFromIcon('tech:apache-flink-icon')).toBe('Apache Flink')
    expect(deriveTechnologyFromIcon('tech:adobe-icon')).toBe('Adobe')
  })

  it('returns undefined for bootstrap: icons', () => {
    expect(deriveTechnologyFromIcon('bootstrap:house')).toBeUndefined()
    expect(deriveTechnologyFromIcon('bootstrap:gear-fill')).toBeUndefined()
  })

  it('returns undefined for undefined/null/empty input', () => {
    expect(deriveTechnologyFromIcon(undefined)).toBeUndefined()
    expect(deriveTechnologyFromIcon('')).toBeUndefined()
  })

  it('returns undefined for URL icons', () => {
    expect(deriveTechnologyFromIcon('https://example.com/icon.png')).toBeUndefined()
    expect(deriveTechnologyFromIcon('http://example.com/icon.png')).toBeUndefined()
  })

  it('returns undefined for "none"', () => {
    expect(deriveTechnologyFromIcon('none')).toBeUndefined()
  })
})

describe('inferTechnologyFromIcon integration', () => {
  it('derives technology from element icon', async () => {
    const { validate, buildModel } = createTestServices()
    await validate(`
      specification {
        element component
      }
      model {
        comp1 = component 'Flink App' {
          icon tech:apache-flink
        }
        comp2 = component 'Storage' {
          icon aws:simple-storage-service
        }
        comp3 = component 'VM' {
          icon azure:virtual-machine
        }
        comp4 = component 'Engine' {
          icon gcp:compute-engine
        }
      }
    `)

    const model = await buildModel()
    expect(model.elements['comp1']?.technology).toBe('Apache Flink')
    expect(model.elements['comp2']?.technology).toBe('Simple Storage Service')
    expect(model.elements['comp3']?.technology).toBe('Virtual Machine')
    expect(model.elements['comp4']?.technology).toBe('Compute Engine')
  })

  it('does not derive from bootstrap icons', async () => {
    const { validate, buildModel } = createTestServices()
    await validate(`
      specification {
        element component
      }
      model {
        comp1 = component {
          icon bootstrap:house
        }
      }
    `)

    const model = await buildModel()
    expect(model.elements['comp1']?.technology).toBeUndefined()
  })

  it('preserves explicit element technology', async () => {
    const { validate, buildModel } = createTestServices()
    await validate(`
      specification {
        element component
      }
      model {
        comp1 = component 'My App' 'summary' 'Custom Tech' {
          icon tech:react
        }
      }
    `)

    const model = await buildModel()
    expect(model.elements['comp1']?.technology).toBe('Custom Tech')
  })

  it('preserves kind-level technology', async () => {
    const { validate, buildModel } = createTestServices()
    await validate(`
      specification {
        element component {
          technology 'Kind Tech'
        }
      }
      model {
        comp1 = component 'My App' {
          icon tech:react
        }
      }
    `)

    const model = await buildModel()
    expect(model.elements['comp1']?.technology).toBe('Kind Tech')
  })

  it('derives technology from kind-level icon', async () => {
    const { validate, buildModel } = createTestServices()
    await validate(`
      specification {
        element component {
          style {
            icon tech:docker
          }
        }
      }
      model {
        comp1 = component 'My Container'
      }
    `)

    const model = await buildModel()
    expect(model.elements['comp1']?.technology).toBe('Docker')
  })

  it('can be disabled via config', async () => {
    const { validate, buildModel } = createTestServices({
      projectConfig: {
        inferTechnologyFromIcon: false,
      },
    })
    await validate(`
      specification {
        element component
      }
      model {
        comp1 = component {
          icon tech:react
        }
      }
    `)

    const model = await buildModel()
    expect(model.elements['comp1']?.technology).toBeUndefined()
  })
})
