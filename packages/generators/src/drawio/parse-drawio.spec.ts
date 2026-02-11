import { expect, test } from 'vitest'
import { parseDrawioToLikeC4 } from './parse-drawio'

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

test('parse DrawIO to LikeC4 - minimal diagram', () => {
  expect(parseDrawioToLikeC4(minimalDrawio)).toMatchSnapshot()
})

test('parse DrawIO to LikeC4 - with LikeC4 description and technology', () => {
  expect(parseDrawioToLikeC4(drawioWithLikeC4Data)).toMatchSnapshot()
})

test('parse DrawIO to LikeC4 - empty XML returns minimal model', () => {
  const result = parseDrawioToLikeC4('<?xml version="1.0"?><mxfile><root><mxCell id="0"/></root></mxfile>')
  expect(result).toContain('model {')
  expect(result).toContain('views {')
  expect(result).toContain('view index {')
  expect(result).toContain('include *')
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
