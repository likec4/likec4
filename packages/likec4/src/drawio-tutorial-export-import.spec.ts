/**
 * Integration tests for DrawIO export/import using the tutorial model.
 * Verifies that export (LikeC4 → DrawIO) and import (DrawIO → LikeC4) produce
 * valid output and that round-trip preserves key elements and relationships.
 */

import {
  generateDrawio,
  generateDrawioMulti,
  getAllDiagrams,
  parseDrawioToLikeC4,
  parseDrawioToLikeC4Multi,
} from '@likec4/generators'
import { describe, expect, it } from 'vitest'
import { expectDrawioXmlLoadableInDrawio } from './drawio-test-utils'
import { LikeC4 } from './LikeC4'

const TUTORIAL_SOURCE = `
specification {
  element actor
  element system
  element component

  tag ui {
    color #33B074
  }
  tag version1 {
    color #D6409F
  }
  tag warn
}

model {
  customer = actor 'Customer' {
    description 'The regular customer of the system'
  }

  saas = system 'Our SaaS' {
    #version1

    component ui 'Frontend' {
      #ui #warn
      description 'Nextjs application, hosted on Vercel'
      style {
        icon tech:nextjs-icon
        shape browser
      }
    }

    component backend 'Backend Services' {
      description '
        Implements business logic
        and exposes as REST API
      '
    }

    ui -> backend 'fetches via HTTPS'
  }

  customer -> ui 'opens in browser'
  customer -> saas 'enjoys our product'
}

views {

  view index {
    title 'Landscape view'

    include *
  }

  view saas of saas {
    include *

    style * {
      opacity 25%
    }
    style customer {
      color muted
    }
  }

}
`.trimStart()

describe('DrawIO export/import with tutorial', () => {
  it('exports tutorial view index to valid DrawIO XML and diagram contains expected elements', async () => {
    const likec4 = await LikeC4.fromSource(TUTORIAL_SOURCE)
    expect(likec4.hasErrors()).toBe(false)

    const model = await likec4.layoutedModel()
    const vmIndex = model.view('index')
    expect(vmIndex).toBeDefined()

    const drawioXml = generateDrawio(vmIndex!)
    expect(drawioXml).toContain('<?xml version="1.0"')
    expect(drawioXml).toContain('<mxfile ')
    expect(drawioXml).toContain('<diagram ')

    const diagrams = getAllDiagrams(drawioXml)
    expect(diagrams.length).toBe(1)
    const d0 = diagrams[0]!
    expect(d0.name).toBe('Landscape view')
    expect(d0.id).toBe('likec4-index')

    const content = d0.content
    expect(content).toContain('<mxGraphModel')
    expect(content).toContain('Customer')
    expect(content).toContain('Our SaaS')
    expect(content).toContain('enjoys our product')
    expect(content).toContain('mxCell')
    expect(content).toMatch(/vertex="1"/)
    expect(content).toMatch(/edge="1"/)

    expectDrawioXmlLoadableInDrawio(drawioXml)
  })

  it('exports all tutorial views with generateDrawioMulti and multi-diagram XML is valid', async () => {
    const likec4 = await LikeC4.fromSource(TUTORIAL_SOURCE)
    expect(likec4.hasErrors()).toBe(false)

    const model = await likec4.layoutedModel()
    const viewmodels = [...model.views()]
    // 2 explicit views + 3 implicit views (customer, saas.ui, saas.backend)
    expect(viewmodels.length).toBe(5)

    const drawioXml = generateDrawioMulti(viewmodels)
    expect(drawioXml).toContain('<?xml version="1.0"')
    expect(drawioXml).toContain('<mxfile ')

    const diagrams = getAllDiagrams(drawioXml)
    expect(diagrams.length).toBe(5)
    const indexDiagram = diagrams.find(d => d.name === 'Landscape view')
    const saasDiagram = diagrams.find(d => d.id === 'likec4-saas')
    expect(indexDiagram).toBeDefined()
    expect(saasDiagram).toBeDefined()

    for (const d of diagrams) {
      expect(d.content).toContain('<mxGraphModel')
    }
    expect(indexDiagram!.content).toContain('Customer')
    expect(saasDiagram!.content).toContain('Frontend')
    expect(saasDiagram!.content).toContain('Backend')

    expectDrawioXmlLoadableInDrawio(drawioXml)
  })

  it.skip('imports exported DrawIO XML back to valid LikeC4 source with model and views (import PR)', async () => {
    const likec4 = await LikeC4.fromSource(TUTORIAL_SOURCE)
    expect(likec4.hasErrors()).toBe(false)

    const model = await likec4.layoutedModel()
    const drawioXml = generateDrawio(model.view('index')!)

    const c4Source = parseDrawioToLikeC4(drawioXml)

    expect(c4Source).toContain('model {')
    expect(c4Source).toContain('views {')
    expect(c4Source).toContain('Customer')
    expect(c4Source).toContain('Our SaaS')
    expect(c4Source).toContain('enjoys our product')
    expect(c4Source).toContain('view ')
    expect(c4Source).toMatch(/->.*'enjoys our product'/)
  })

  it.skip('round-trip: exported DrawIO re-imports to .c4 source with model and relationships (import PR)', async () => {
    const likec4 = await LikeC4.fromSource(TUTORIAL_SOURCE)
    expect(likec4.hasErrors()).toBe(false)

    const model = await likec4.layoutedModel()
    const drawioXml = generateDrawio(model.view('index')!)
    const c4Source = parseDrawioToLikeC4(drawioXml)

    expect(c4Source).toContain('model {')
    expect(c4Source).toContain('views {')
    expect(c4Source).toContain('Customer')
    expect(c4Source).toContain('Our SaaS')
    expect(c4Source).toContain('enjoys our product')
    expect(c4Source).toContain('// <likec4.layout.drawio>')
  })

  it.skip('multi-diagram export re-imports with parseDrawioToLikeC4Multi and produces multiple views (import PR)', async () => {
    const likec4 = await LikeC4.fromSource(TUTORIAL_SOURCE)
    expect(likec4.hasErrors()).toBe(false)

    const model = await likec4.layoutedModel()
    const drawioXml = generateDrawioMulti([...model.views()])

    const c4Source = parseDrawioToLikeC4Multi(drawioXml)

    expect(c4Source).toContain('model {')
    expect(c4Source).toContain('views {')
    expect(c4Source).toContain('Customer')
    expect(c4Source).toContain('Our SaaS')
    expect(c4Source).toContain('Frontend')
    expect(c4Source).toContain('Backend')
    expect(c4Source).toContain('view ')
    expect(c4Source).toMatch(/view\s+\w+/)
    const viewCount = (c4Source.match(/view\s+\w+/g) ?? []).length
    expect(viewCount).toBeGreaterThanOrEqual(2)

    const reimported = await LikeC4.fromSource(c4Source, { throwIfInvalid: false })
    const reimportModel = reimported.syncComputedModel()
    expect([...reimportModel.views()].length).toBeGreaterThanOrEqual(1)
  })
})
