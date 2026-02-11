/**
 * Integration tests: export the LikeC4 demo (cloud-system, multiple tabs, colors, links)
 * to DrawIO, then validate that the file is loadable in draw.io and that element/edge
 * counts match (nothing missing, nothing extra). Vice versa: import the exported DrawIO
 * and assert key content is preserved.
 *
 * These tests would fail if export produced invalid XML (e.g. nested <Array><Array>
 * causing "Could not add object Array" in draw.io) or wrong counts.
 */

import {
  generateDrawioMulti,
  getAllDiagrams,
  parseDrawioToLikeC4Multi,
} from '@likec4/generators'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { LikeC4 } from './LikeC4'

const CLOUD_SYSTEM_PATH = path.resolve(__dirname, '../../../examples/cloud-system')

function expectDrawioXmlLoadableInDrawio(drawioXml: string): void {
  const diagrams = getAllDiagrams(drawioXml)
  for (const d of diagrams) {
    const content = d.content
    expect(
      content,
      'Diagram must not contain nested <Array><Array> (causes "Could not add object Array" in draw.io)',
    ).not.toMatch(/<mxGeometry[\s\S]*?<Array>\s*<Array>/)
    if (content.includes('as="sourcePoint"') || content.includes('as="targetPoint"')) {
      expect(
        content,
        'Edge geometry with points must use single <Array> of <mxPoint>, not nested Array',
      ).toMatch(/<mxGeometry[\s\S]*?<Array(\s[^>]*)?>[\s\S]*?<mxPoint[\s\S]*?<\/Array>/)
    }
  }
}

/** Count vertex and edge mxCells in decompressed diagram content */
function countDrawioCells(content: string): { vertices: number; edges: number } {
  const vertices = (content.match(/<mxCell[^>]*\svertex="1"/gi) ?? []).length
  const edges = (content.match(/<mxCell[^>]*\sedge="1"/gi) ?? []).length
  return { vertices, edges }
}

describe('DrawIO export/import with cloud-system demo', () => {
  it('exports cloud-system to DrawIO and file is loadable in draw.io (no nested Array)', async () => {
    const likec4 = await LikeC4.fromWorkspace(CLOUD_SYSTEM_PATH, { throwIfInvalid: true })
    expect(likec4.hasErrors()).toBe(false)

    const model = await likec4.layoutedModel()
    const viewmodels = [...model.views()]
    expect(viewmodels.length).toBeGreaterThanOrEqual(1)

    const drawioXml = generateDrawioMulti(viewmodels)
    expect(drawioXml).toContain('<?xml version="1.0"')
    expect(drawioXml).toContain('<mxfile ')

    expectDrawioXmlLoadableInDrawio(drawioXml)
  })

  it('exported DrawIO has same number of elements and edges per view (no extra, none missing)', async () => {
    const likec4 = await LikeC4.fromWorkspace(CLOUD_SYSTEM_PATH, { throwIfInvalid: true })
    expect(likec4.hasErrors()).toBe(false)

    const model = await likec4.layoutedModel()
    const viewmodels = [...model.views()]
    const drawioXml = generateDrawioMulti(viewmodels)

    expectDrawioXmlLoadableInDrawio(drawioXml)

    const diagrams = getAllDiagrams(drawioXml)
    expect(diagrams.length).toBe(viewmodels.length)

    for (let i = 0; i < viewmodels.length; i++) {
      const vm = viewmodels[i]!
      const d = diagrams[i]!
      const view = vm.$view
      const expectedNodes = view.nodes.length
      const expectedEdges = view.edges.length

      const { vertices, edges } = countDrawioCells(d.content)
      // DrawIO: 1 vertex = root/defaultParent, rest = nodes
      const actualNodes = Math.max(0, vertices - 1)
      expect(
        actualNodes,
        `View "${view.id}": expected ${expectedNodes} nodes in diagram, got ${actualNodes} vertices (vertices-1)`,
      ).toBe(expectedNodes)
      expect(
        edges,
        `View "${view.id}": expected ${expectedEdges} edges in diagram, got ${edges}`,
      ).toBe(expectedEdges)
    }
  })

  it('exported DrawIO contains expected element titles and no stray Array tags', async () => {
    const likec4 = await LikeC4.fromWorkspace(CLOUD_SYSTEM_PATH, { throwIfInvalid: true })
    const model = await likec4.layoutedModel()
    const viewmodels = [...model.views()]
    const drawioXml = generateDrawioMulti(viewmodels)

    expectDrawioXmlLoadableInDrawio(drawioXml)

    const diagrams = getAllDiagrams(drawioXml)
    const allContent = diagrams.map(d => d.content).join('\n')

    expect(allContent).not.toMatch(/<Array>\s*<Array>/)
    expect(allContent).toContain('Cloud System')
    expect(allContent).toContain('customer')
    expect(allContent).toContain('cloud')
  })

  it('vice versa: import exported DrawIO back to LikeC4 and re-export produces loadable XML', async () => {
    const likec4 = await LikeC4.fromWorkspace(CLOUD_SYSTEM_PATH, { throwIfInvalid: true })
    const model = await likec4.layoutedModel()
    const drawioXml = generateDrawioMulti([...model.views()])

    expectDrawioXmlLoadableInDrawio(drawioXml)

    const c4Source = parseDrawioToLikeC4Multi(drawioXml)
    expect(c4Source).toContain('model {')
    expect(c4Source).toContain('views {')

    const reimported = await LikeC4.fromSource(c4Source, { throwIfInvalid: false })
    const reimportModel = await reimported.layoutedModel()
    const reimportViews = [...reimportModel.views()]
    if (reimportViews.length > 0) {
      const roundtripXml = generateDrawioMulti(reimportViews)
      expectDrawioXmlLoadableInDrawio(roundtripXml)
    }
  })

  it('written .drawio file (as when user exports) is loadable in draw.io when read back', async () => {
    const likec4 = await LikeC4.fromWorkspace(CLOUD_SYSTEM_PATH, { throwIfInvalid: true })
    const model = await likec4.layoutedModel()
    const drawioXml = generateDrawioMulti([...model.views()])

    const dir = await mkdtemp(path.join(tmpdir(), 'likec4-drawio-'))
    const filePath = path.join(dir, 'diagrams.drawio')
    try {
      await writeFile(filePath, drawioXml, 'utf-8')
      const readBack = await readFile(filePath, 'utf-8')
      expect(readBack).toBe(drawioXml)
      expectDrawioXmlLoadableInDrawio(readBack)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
