import pako from 'pako'
import { describe, expect, test } from 'vitest'
import {
  decompressDrawioDiagram,
  parseDrawioRoundtripComments,
  parseDrawioToLikeC4,
  parseDrawioToLikeC4Multi,
} from './parse-drawio'

const minimalDrawio = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="test">
  <diagram name="test">
    <mxGraphModel>
      <root>
        <mxCell id="0" />
        <mxCell id="1" vertex="1" parent="0">
          <mxGeometry width="800" height="600" as="geometry" />
        </mxCell>
        <mxCell id="2" value="Frontend" style="shape=rectangle;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
          <mxGeometry x="100" y="80" width="120" height="60" as="geometry" />
        </mxCell>
        <mxCell id="3" value="Backend" style="shape=rectangle;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
          <mxGeometry x="100" y="200" width="120" height="60" as="geometry" />
        </mxCell>
        <mxCell id="4" value="requests" style="strokeColor=#6c8ebf;" edge="1" parent="1" source="2" target="3">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`

const drawioWithLikeC4Data = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile>
  <diagram>
    <mxGraphModel><root>
      <mxCell id="0" />
      <mxCell id="1" vertex="1" parent="0"><mxGeometry width="800" height="600" as="geometry" /></mxCell>
      <mxCell id="2" value="API" style="shape=rectangle;fillColor=#3b82f6;" vertex="1" parent="1">
        <mxUserObject><data key="likec4Description">REST API service</data><data key="likec4Technology">Node.js</data></mxUserObject>
        <mxGeometry x="50" y="50" width="100" height="50" as="geometry" />
      </mxCell>
    </root></mxGraphModel>
  </diagram>
</mxfile>`

describe('parseDrawioToLikeC4', () => {
  test('parse DrawIO to LikeC4 - minimal diagram', () => {
    expect(parseDrawioToLikeC4(minimalDrawio)).toMatchSnapshot()
  })

  test('parse DrawIO to LikeC4 - with LikeC4 description and technology', () => {
    expect(parseDrawioToLikeC4(drawioWithLikeC4Data)).toMatchSnapshot()
  })

  test('parse DrawIO to LikeC4 - empty XML returns minimal model', () => {
    // No <diagram> wrapper: getAllDiagrams returns [], getFirstDiagram uses default { name: 'index', id: '...', content: '' }
    const result = parseDrawioToLikeC4('<?xml version="1.0"?><mxfile><root><mxCell id="0"/></root></mxfile>')
    expect(result).toContain('model {')
    expect(result).toContain('views {')
    expect(result).toContain('view index {')
    expect(result).toContain('include *')
  })
})

const drawioWithCustomDataKeys = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile>
  <diagram>
    <mxGraphModel><root>
      <mxCell id="0" />
      <mxCell id="1" vertex="1" parent="0"><mxGeometry width="400" height="300" as="geometry" /></mxCell>
      <mxCell id="2" value="Widget" style="shape=rectangle;fillColor=#dae8fc;" vertex="1" parent="1">
        <mxGeometry x="50" y="50" width="100" height="50" as="geometry" />
        <mxUserObject><data key="customKey">customValue</data><data key="likec4Description">Mapped desc</data></mxUserObject>
      </mxCell>
    </root></mxGraphModel>
  </diagram>
</mxfile>`

test('parse DrawIO to LikeC4 - vertex with custom mxUserObject data keys emits customData comment', () => {
  const result = parseDrawioToLikeC4(drawioWithCustomDataKeys)
  expect(result).toContain('description \'Mapped desc\'')
  expect(result).toContain('// <likec4.customData>')
  expect(result).toContain('// </likec4.customData>')
  expect(result).toContain('"customKey":"customValue"')
})

const drawioEdgeWithLikeC4Style = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile>
  <diagram>
    <mxGraphModel><root>
      <mxCell id="0" />
      <mxCell id="1" vertex="1" parent="0"><mxGeometry width="800" height="600" as="geometry" /></mxCell>
      <mxCell id="2" value="A" style="shape=rectangle;" vertex="1" parent="1"><mxGeometry x="0" y="0" width="80" height="40" as="geometry" /></mxCell>
      <mxCell id="3" value="B" style="shape=rectangle;" vertex="1" parent="1"><mxGeometry x="200" y="0" width="80" height="40" as="geometry" /></mxCell>
      <mxCell id="4" value="calls" style="endArrow=open;startArrow=none;dashed=1;likec4Description=HTTP%20API;likec4Technology=REST;likec4Notes=async;likec4NavigateTo=detail;" edge="1" parent="1" source="2" target="3">
        <mxGeometry relative="1" as="geometry" />
      </mxCell>
    </root></mxGraphModel>
  </diagram>
</mxfile>`

test('parse DrawIO to LikeC4 - edge with LikeC4 style (description, technology, notes, navigateTo, arrows, dashed)', () => {
  expect(parseDrawioToLikeC4(drawioEdgeWithLikeC4Style)).toMatchSnapshot()
})

const drawioWithUserObjectLink = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile>
  <diagram>
    <mxGraphModel><root>
      <mxCell id="0" />
      <mxCell id="1" vertex="1" parent="0"><mxGeometry width="800" height="600" as="geometry" /></mxCell>
      <mxCell id="2" value="Customer" style="shape=rectangle;" vertex="1" parent="1"><mxGeometry x="0" y="0" width="80" height="40" as="geometry" /></mxCell>
      <UserObject label="Our SaaS" link="data:page/id,likec4-saas" id="3">
        <mxCell parent="1" style="shape=rectangle;rounded=1;fillColor=#3b82f6;likec4NavigateTo=saas;" value="Our SaaS" vertex="1">
          <mxGeometry x="100" y="0" width="80" height="40" as="geometry" />
        </mxCell>
      </UserObject>
      <mxCell id="4" value="uses" edge="1" parent="1" source="2" target="3"><mxGeometry relative="1" as="geometry" /></mxCell>
    </root></mxGraphModel>
  </diagram>
</mxfile>`

test('parse DrawIO to LikeC4 - UserObject with link=data:page/id,likec4-<viewId> yields navigateTo in model', () => {
  const result = parseDrawioToLikeC4(drawioWithUserObjectLink)
  expect(result).toContain('navigateTo saas')
  expect(result).toContain('Our SaaS')
  expect(result).toMatchSnapshot()
})

const drawioTwoTabs = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile>
  <diagram name="overview">
    <mxGraphModel><root>
      <mxCell id="0" /><mxCell id="1" vertex="1" parent="0"><mxGeometry width="400" height="300" as="geometry" /></mxCell>
      <mxCell id="2" value="A" style="shape=rectangle;" vertex="1" parent="1"><mxGeometry x="0" y="0" width="80" height="40" as="geometry" /></mxCell>
      <mxCell id="3" value="B" style="shape=rectangle;" vertex="1" parent="1"><mxGeometry x="200" y="0" width="80" height="40" as="geometry" /></mxCell>
    </root></mxGraphModel>
  </diagram>
  <diagram name="detail">
    <mxGraphModel><root>
      <mxCell id="0" /><mxCell id="1" vertex="1" parent="0"><mxGeometry width="400" height="300" as="geometry" /></mxCell>
      <mxCell id="2" value="A" style="shape=rectangle;" vertex="1" parent="1"><mxGeometry x="0" y="0" width="80" height="40" as="geometry" /></mxCell>
      <mxCell id="3" value="C" style="shape=rectangle;" vertex="1" parent="1"><mxGeometry x="200" y="0" width="80" height="40" as="geometry" /></mxCell>
    </root></mxGraphModel>
  </diagram>
</mxfile>`

describe('parseDrawioToLikeC4Multi', () => {
  test('two diagrams produce one model and two views with include lists', () => {
    const result = parseDrawioToLikeC4Multi(drawioTwoTabs)
    expect(result).toContain('view overview')
    expect(result).toContain('view detail')
    expect(result).toContain('include A, B')
    expect(result).toContain('include A, C')
    expect(result).toContain('model {')
    expect(result).toMatchSnapshot()
  })
})

describe('parseDrawioRoundtripComments', () => {
  test('extracts layout, stroke, waypoints from comment blocks', () => {
    const c4WithComments = `
model { }
views { view v1 { include * } }

// <likec4.layout.drawio>
// {"v1":{"nodes":{"A":{"x":10,"y":20,"width":100,"height":50},"B":{"x":200,"y":20,"width":80,"height":40}}}}
// </likec4.layout.drawio>
// <likec4.strokeColor.vertices>
// A=#6c8ebf
// B=#82b366
// </likec4.strokeColor.vertices>
// <likec4.strokeWidth.vertices>
// A=2
// B=1
// </likec4.strokeWidth.vertices>
// <likec4.edge.waypoints>
// A|B [[50,40],[150,40]]
// </likec4.edge.waypoints>
`
    const data = parseDrawioRoundtripComments(c4WithComments)
    expect(data).not.toBeNull()
    expect(data!['layoutByView']['v1']?.['nodes']?.['A']).toEqual({ x: 10, y: 20, width: 100, height: 50 })
    expect(data!['layoutByView']['v1']?.['nodes']?.['B']).toEqual({ x: 200, y: 20, width: 80, height: 40 })
    expect(data!['strokeColorByFqn']['A']).toBe('#6c8ebf')
    expect(data!['strokeColorByFqn']['B']).toBe('#82b366')
    expect(data!['strokeWidthByFqn']['A']).toBe('2')
    expect(data!['strokeWidthByFqn']['B']).toBe('1')
    expect(data!['edgeWaypoints']['A|B']).toEqual([
      [50, 40],
      [150, 40],
    ])
  })

  test('returns null when no comment blocks', () => {
    expect(parseDrawioRoundtripComments('model { }\nviews { }')).toBeNull()
    expect(parseDrawioRoundtripComments('')).toBeNull()
  })
})

describe('decompressDrawioDiagram', () => {
  test('invalid base64 throws with clear message', () => {
    expect(() => decompressDrawioDiagram('not-valid-base64!!')).toThrow(
      /DrawIO diagram decompression failed \((base64 decode|inflate|URI decode)\)/,
    )
  })

  test('decompresses valid base64+deflate content', () => {
    const original = '<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'
    const encoded = encodeURIComponent(original)
    const bytes = new TextEncoder().encode(encoded)
    const deflated = pako.deflateRaw(bytes)
    const base64 = Buffer.from(deflated).toString('base64')
    expect(decompressDrawioDiagram(base64)).toBe(original)
  })
})
