import { Builder } from '@likec4/core/builder'
import type { aux, ProcessedView } from '@likec4/core/types'
import { describe, expect, test } from 'vitest'
import { fakeComputedView3Levels, fakeDiagram, fakeDiagram2 } from '../__mocks__/data'
import type { DrawioViewModelLike } from '@likec4/generators'
import {
  generateDrawio,
  generateDrawioMulti,
  getAllDiagrams,
  parseDrawioToLikeC4,
} from '@likec4/generators'

/**
 * Asserts that the DrawIO XML does not contain the structure that causes
 * "Could not add object Array" in draw.io. Draw.io expects a single <Array>
 * of <mxPoint> inside mxGeometry for edge waypoints; nested <Array><Array> is invalid.
 * Duplicated from packages/likec4/src/drawio-test-utils.ts for unit specs; keep in sync if validation logic changes.
 */
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
        'Edge geometry with points must use single <Array> (or <Array as="points">) of <mxPoint>, not nested Array',
      ).toMatch(/<mxGeometry[\s\S]*?<Array(\s[^>]*)?>[\s\S]*?<mxPoint[\s\S]*?<\/Array>/)
    }
  }
}

const b = Builder
  .specification({
    elements: {
      actor: {},
      system: {},
      component: {},
    },
    deployments: {
      env: {},
      vm: {},
    },
    tags: {
      t1: {},
    },
  })
  .model(({ actor, system, component, rel }, _) =>
    _(
      actor('alice', 'Alice'),
      actor('bob', 'Bob'),
      system('cloud', 'Cloud').with(
        component('backend', 'Backend').with(
          component('api', 'API'),
          component('db', 'DB'),
        ),
        component('frontend'),
      ),
      rel('alice', 'cloud.frontend', {
        title: 'uses \n at home',
      }),
      rel('bob', 'cloud.frontend', {
        title: 'uses \n at work',
      }),
      rel('cloud.backend.api', 'cloud.backend.db'),
      rel('cloud.frontend', 'cloud.backend.api', {
        title: 'requests',
        tags: ['t1'],
      }),
    )
  )

function mockViewModel($view: ProcessedView<aux.Unknown>): DrawioViewModelLike {
  return { $view }
}

/** Minimal view with two actor nodes (kind=actor, shape=person) for DrawIO actor tests. Inlined so this spec works with package import (@likec4/generators) without fixture resolution issues. */
const fakeActorView: ProcessedView<aux.Unknown> = {
  edges: [
    {
      headArrow: [[154, 200], [150, 210], [146, 200]],
      id: 'alice:bob',
      label: 'uses',
      labelBox: { align: 'left', width: 30, x: 80, y: 175 },
      points: [[100, 100], [100, 150], [150, 200]],
      relations: ['alice:bob'],
      source: 'alice',
      target: 'bob',
    },
  ],
  height: 300,
  id: 'index',
  nodes: [
    { children: [], color: 'primary', id: 'alice', kind: 'actor', parent: null, position: [0, 0], relative: [0, 0], shape: 'person', size: { height: 80, width: 60 }, title: 'Alice' },
    { children: [], color: 'primary', id: 'bob', kind: 'actor', parent: null, position: [200, 200], relative: [200, 200], shape: 'person', size: { height: 80, width: 60 }, title: 'Bob' },
  ],
  autoLayout: { direction: 'TB' },
  rules: [{ exprs: [{ wildcard: true }], isInclude: true }],
  title: 'Actors',
  width: 300,
} as ProcessedView<aux.Unknown>

/** Build layouted view models for generateDrawioMulti from processed views (DRY in specs). */
function getLayoutedViewmodels(views: ProcessedView<aux.Unknown>[]): DrawioViewModelLike[] {
  return views.map(v => mockViewModel(v))
}

/** View with node kinds set so leanixFactSheetTypeByKind is applied (system for containers, component for leaves). */
function viewWithElementKindsForLeanix(view: ProcessedView<aux.Unknown>): ProcessedView<aux.Unknown> {
  return {
    ...view,
    nodes: view.nodes.map(n => ({
      ...n,
      kind: n.id === 'cloud' || (n.children?.length ?? 0) > 0 ? 'system' : 'component',
    })),
  } as ProcessedView<aux.Unknown>
}

/**
 * Normalize variable output for stable snapshots across environments.
 * - Fixes modified date.
 * - Replaces diagram layout body (base64) with a placeholder so snapshots
 *   do not depend on Graphviz/layout output that can vary by OS or version.
 */
function normalizeDrawioXml(xml: string): string {
  return xml
    .replace(/modified="[^"]*"/g, 'modified="FIXED-DATE"')
    .replace(/<diagram\b([^>]*)>[\s\S]*?<\/diagram>/g, '<diagram$1>LAYOUT</diagram>')
}

test('generate DrawIO - landscape', () => {
  const m = b
    .views(({ view, $include }) =>
      view('index', {
        title: 'Layout',
        description: 'description',
      }).with(
        $include('*'),
      )
    )
    .toLikeC4Model()
  expect(normalizeDrawioXml(generateDrawio(m.view('index')!))).toMatchSnapshot()
})

test('generate DrawIO - element view', () => {
  const m = b
    .views(({ viewOf, $include }) =>
      viewOf('v1', 'cloud').with(
        $include('*'),
      )
    )
    .toLikeC4Model()
  expect(normalizeDrawioXml(generateDrawio(m.view('v1')!))).toMatchSnapshot()
})

test('generate DrawIO - fakeDiagram', () => {
  expect(normalizeDrawioXml(generateDrawio(mockViewModel(fakeDiagram)))).toMatchSnapshot()
})

test('generate DrawIO - fakeDiagram2', () => {
  expect(normalizeDrawioXml(generateDrawio(mockViewModel(fakeDiagram2)))).toMatchSnapshot()
})

test('generate DrawIO - fakeComputedView 3 Levels', () => {
  expect(normalizeDrawioXml(generateDrawio(mockViewModel(fakeComputedView3Levels)))).toMatchSnapshot()
})

test('generated DrawIO with edge waypoints is loadable in draw.io (no nested Array)', () => {
  const xml = generateDrawio(mockViewModel(fakeDiagram))
  expectDrawioXmlLoadableInDrawio(xml)
})

test('generated DrawIO multi with edge waypoints is loadable in draw.io', () => {
  const xml = generateDrawioMulti(getLayoutedViewmodels([fakeDiagram, fakeDiagram2]), {})
  expectDrawioXmlLoadableInDrawio(xml)
})

test('generateDrawio with compressed: false writes uncompressed XML inside diagram', () => {
  const xml = generateDrawio(mockViewModel(fakeDiagram), { compressed: false })
  expect(xml).toContain('<?xml version="1.0"')
  expect(xml).toContain('<diagram ')
  expect(xml).not.toMatch(/<diagram[^>]*>[A-Za-z0-9+/=]{100,}/) // no long base64 blob
  expect(xml).toContain('<mxGraphModel')
  expect(xml).toContain('<root>')
  const diagrams = getAllDiagrams(xml)
  expect(diagrams).toHaveLength(1)
  expect(diagrams[0]!.content).toContain('<mxGraphModel')
  expectDrawioXmlLoadableInDrawio(xml)
})

describe('DrawIO output structure (validates XML shape and key features)', () => {
  test('mxfile has host LikeC4 and diagram has name and id likec4-<viewId>', () => {
    const xml = generateDrawio(mockViewModel(fakeDiagram), { compressed: false })
    expect(xml).toMatch(/<\?xml version="1\.0" encoding="UTF-8"\?>/)
    expect(xml).toMatch(/<mxfile[^>]*host="LikeC4"/)
    const diagrams = getAllDiagrams(xml)
    expect(diagrams).toHaveLength(1)
    expect(diagrams[0]!.id).toMatch(/^likec4-/)
    expect(diagrams[0]!.name).toBeTruthy()
  })

  test('root has mxCell id=0 and wrapper cell id=1 with invisible style (no visible rectangle)', () => {
    const xml = generateDrawio(mockViewModel(fakeDiagram), { compressed: false })
    const diagrams = getAllDiagrams(xml)
    const content = diagrams[0]!.content
    expect(content).toContain('<mxCell id="0"')
    expect(content).toMatch(/<mxCell id="1"[^>]*value=""[^>]*style="[^"]*fillColor=none[^"]*strokeColor=none/)
    expect(content).toMatch(/<mxCell id="1"[^>]*parent="0"/)
  })

  test('vertex cells have mxUserObject before mxGeometry when present (parser/roundtrip alignment)', () => {
    const xml = generateDrawio(mockViewModel(fakeDiagram), { compressed: false })
    const content = getAllDiagrams(xml)[0]!.content
    // Wrong order would be <mxGeometry .../> before <mxUserObject> in the same cell; must not occur
    expect(
      content,
      'mxUserObject must appear before mxGeometry inside vertex cells for draw.io parser compatibility',
    ).not.toMatch(/<mxCell[^>]*vertex="1"[^>]*>\s*<mxGeometry[\s\S]*?\/>\s*<mxUserObject>/)
  })

  test('vertices and edges have parent="1" (single layer, arrows draw correctly)', () => {
    const xml = generateDrawio(mockViewModel(fakeDiagram), { compressed: false })
    const content = getAllDiagrams(xml)[0]!.content
    // Only the wrapper cell (id=1) has parent="0"; all content vertices and edges must have parent="1"
    const parent0Count = (content.match(/parent="0"/g) ?? []).length
    expect(parent0Count, 'Only the wrapper cell id=1 should have parent="0"').toBe(1)
    // At least one edge must have parent="1" so arrows render
    expect(content).toMatch(/parent="1".*edge="1"|edge="1".*parent="1"/)
  })

  test('edge label style includes fontColor (theme-aligned; no background for LikeC4 look)', () => {
    const xml = generateDrawio(mockViewModel(fakeDiagram), { compressed: false })
    const content = getAllDiagrams(xml)[0]!.content
    expect(
      content,
      'Edge with label must include fontColor for theme-aligned label text',
    ).toMatch(/value="requests".*fontColor=[^;]+;/)
  })

  test('container nodes (bounded context with children) export with container=1, dashed border and fillOpacity', () => {
    const xml = generateDrawio(mockViewModel(fakeComputedView3Levels), { compressed: false })
    const content = getAllDiagrams(xml)[0]!.content
    expect(
      content,
      'At least one vertex (container) must have container=1 for draw.io container behavior',
    ).toMatch(/container=1/)
    expect(
      content,
      'Container vertices must have dashed=1 for bounded-context style',
    ).toMatch(/dashed=1/)
    expect(
      content,
      'Container vertices must have fillOpacity for semi-transparent context',
    ).toMatch(/fillOpacity=\d+/)
  })

  test('actor (shape person) exports with shape=actor in vertex style for round-trip', () => {
    const xml = generateDrawio(mockViewModel(fakeActorView), { compressed: false })
    const content = getAllDiagrams(xml)[0]!.content
    expect(
      content,
      'Actor nodes must export shape=actor or shape=umlActor in style so re-import infers actor',
    ).toMatch(/style="[^"]*shape=(actor|umlActor)[^"]*"/)
  })

  test('round-trip: generated DrawIO with actor re-imports as actor', () => {
    const xml = generateDrawio(mockViewModel(fakeActorView), { compressed: false })
    const likec4 = parseDrawioToLikeC4(xml)
    expect(likec4, 'Re-imported DrawIO with actors must emit actor elements').toContain("actor 'Alice'")
    expect(likec4).toContain("actor 'Bob'")
  })

  test('node with navigateTo exports UserObject with link and style link=data:page/id opening likec4-<viewId> page', () => {
    // ExtendedNode allows navigateTo; cast for test data (ProcessedView nodes type may not include it). If ProcessedView gains navigateTo, this assertion can be removed.
    const nodeWithNav = {
      ...fakeDiagram.nodes[0]!,
      navigateTo: 'saas',
    } as typeof fakeDiagram.nodes[0] & { navigateTo: string }
    const viewWithNav: ProcessedView<aux.Unknown> = {
      ...fakeDiagram,
      id: 'index' as aux.StrictViewId<aux.Unknown>,
      nodes: [nodeWithNav, ...fakeDiagram.nodes.slice(1)],
    }
    const xml = generateDrawio(mockViewModel(viewWithNav), { compressed: false })
    expect(
      xml,
      'Vertex with navigateTo must be wrapped in UserObject with link="data:page/id,likec4-<viewId>"',
    ).toMatch(/<UserObject[^>]*link="data:page\/id,likec4-saas"/)
    expect(
      xml,
      'Vertex with navigateTo must have style link=data:page/id,likec4-<viewId> so Draw.io opens the page',
    ).toMatch(/link=data%3Apage%2Fid%2Clikec4-saas/)
  })

  test('generateDrawioMulti with N views produces N diagram elements and mxfile pages="N"', () => {
    const viewModels = getLayoutedViewmodels([fakeDiagram, fakeDiagram2])
    const xml = generateDrawioMulti(viewModels, {
      [fakeDiagram.id]: { compressed: false },
      [fakeDiagram2.id]: { compressed: false },
    })
    // draw.io: each <diagram> inside <mxfile> is one page/tab; mxfile should have pages="N"
    expect(xml).toMatch(/<mxfile[^>]*\spages="2"/)
    const diagramCount = (xml.match(/<diagram\s/g) ?? []).length
    expect(diagramCount, 'XML must contain exactly one <diagram> per view (draw.io pages)').toBe(2)
    const diagrams = getAllDiagrams(xml)
    expect(diagrams).toHaveLength(2)
    expect(diagrams.map(d => d.id)).toContain(`likec4-${fakeDiagram.id}`)
    expect(diagrams.map(d => d.id)).toContain(`likec4-${fakeDiagram2.id}`)
  })

  test('generateDrawioMulti with 1 view produces single diagram (no multi-page wrapper)', () => {
    const viewModels = getLayoutedViewmodels([fakeDiagram])
    const xml = generateDrawioMulti(viewModels, { [fakeDiagram.id]: { compressed: false } })
    const diagramCount = (xml.match(/<diagram\s/g) ?? []).length
    expect(diagramCount).toBe(1)
    expect(getAllDiagrams(xml)).toHaveLength(1)
  })
})

describe('DrawIO export profile leanix (bridge-managed metadata)', () => {
  test('profile leanix adds bridgeManaged, likec4Id, likec4Kind, likec4ViewId on vertices and root', () => {
    const xml = generateDrawio(mockViewModel(fakeDiagram), {
      compressed: false,
      profile: 'leanix',
      projectId: 'test-project',
    })
    const content = getAllDiagrams(xml)[0]!.content
    expect(content).toContain('bridgeManaged=true')
    expect(content).toMatch(/likec4Id=([^;]+)/)
    expect(content, 'likec4Kind key must be present (value may be empty when node has no kind)').toMatch(/likec4Kind=/)
    expect(content).toMatch(/likec4ViewId=([^;]+)/)
    expect(content).toContain('likec4ProjectId=test-project')
    // Root cell (id=1) should have likec4ViewId and likec4ProjectId
    expect(content).toMatch(/likec4ViewId=([^;"&]+)/)
  })

  test('profile leanix adds likec4RelationId and bridgeManaged on edges', () => {
    const xml = generateDrawio(mockViewModel(fakeDiagram), {
      compressed: false,
      profile: 'leanix',
    })
    const content = getAllDiagrams(xml)[0]!.content
    expect(content).toMatch(/likec4RelationId=([^;]+)/)
    expect(content, 'Edge style must contain bridgeManaged').toMatch(/bridgeManaged=true/)
  })

  test('profile leanix with leanixFactSheetTypeByKind adds leanixFactSheetType on vertices', () => {
    const viewWithElementKinds = viewWithElementKindsForLeanix(fakeDiagram)
    const xml = generateDrawio(mockViewModel(viewWithElementKinds), {
      compressed: false,
      profile: 'leanix',
      leanixFactSheetTypeByKind: { system: 'Application', component: 'ITComponent' },
    })
    const content = getAllDiagrams(xml)[0]!.content
    expect(content).toMatch(/leanixFactSheetType=([^;]+)/)
  })

  test('profile leanix without projectId adds bridgeManaged and likec4ViewId but no likec4ProjectId', () => {
    const xml = generateDrawio(mockViewModel(fakeDiagram), { compressed: false, profile: 'leanix' })
    const content = getAllDiagrams(xml)[0]!.content
    expect(content).toContain('bridgeManaged=true')
    expect(content).toMatch(/likec4ViewId=([^;"&]+)/)
    expect(content).not.toContain('likec4ProjectId=')
  })

  test('profile default does not add bridgeManaged or likec4Id', () => {
    const xml = generateDrawio(mockViewModel(fakeDiagram), { compressed: false })
    const content = getAllDiagrams(xml)[0]!.content
    expect(content).not.toContain('bridgeManaged=true')
    expect(content).not.toMatch(/likec4Id=/)
  })

  test('bridge-managed export is loadable in draw.io (valid XML)', () => {
    const xml = generateDrawio(mockViewModel(fakeDiagram), {
      compressed: false,
      profile: 'leanix',
      projectId: 'my-project',
    })
    expectDrawioXmlLoadableInDrawio(xml)
  })

  test('roundtrip: export with profile leanix then parse yields LikeC4 source with elements and view', () => {
    const xml = generateDrawio(mockViewModel(fakeDiagram), {
      compressed: false,
      profile: 'leanix',
      projectId: 'test-project',
    })
    const parsed = parseDrawioToLikeC4(xml)
    expect(parsed).toContain('view')
    expect(parsed).toMatch(/include\s+/)
    // Diagram has cloud, cloud.backend, cloud.backend.api, etc.; parser infers from structure
    expect(parsed.length).toBeGreaterThan(100)
    expect(parsed).not.toMatch(/undefined|null/)
  })
})
