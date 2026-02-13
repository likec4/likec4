/**
 * Shared test helpers for DrawIO export/import specs (DRY between drawio-tutorial and drawio-demo).
 */

import { getAllDiagrams } from '@likec4/generators'
import { expect } from 'vitest'

/** Regex: nested <Array><Array> inside mxGeometry (invalid in draw.io; causes "Could not add object Array"). */
const NESTED_ARRAY_IN_GEOMETRY = /<mxGeometry[\s\S]*?<Array>\s*<Array>/
/** Regex: single <Array> of <mxPoint> for edge geometry (valid structure). */
const EDGE_GEOMETRY_SINGLE_ARRAY = /<mxGeometry[\s\S]*?<Array(\s[^>]*)?>[\s\S]*?<mxPoint[\s\S]*?<\/Array>/
const VERTEX_CELL_PATTERN = /<mxCell[^>]*\svertex="1"/gi
const EDGE_CELL_PATTERN = /<mxCell[^>]*\sedge="1"/gi

/**
 * Asserts that the DrawIO XML does not contain the structure that causes
 * "Could not add object Array" in draw.io. Draw.io expects a single <Array>
 * of <mxPoint> inside mxGeometry for edge waypoints; nested <Array><Array> is invalid.
 */
export function expectDrawioXmlLoadableInDrawio(drawioXml: string): void {
  const diagrams = getAllDiagrams(drawioXml)
  for (const d of diagrams) {
    const content = d.content
    expect(
      content,
      'Diagram must not contain nested <Array><Array> (causes "Could not add object Array" in draw.io)',
    ).not.toMatch(NESTED_ARRAY_IN_GEOMETRY)
    if (content.includes('as="sourcePoint"') || content.includes('as="targetPoint"')) {
      expect(
        content,
        'Edge geometry with points must use single <Array> (or <Array as="points">) of <mxPoint>, not nested Array',
      ).toMatch(EDGE_GEOMETRY_SINGLE_ARRAY)
    }
  }
}

/** Count vertex and edge mxCells in decompressed diagram content */
export function countDrawioCells(content: string): { vertices: number; edges: number } {
  const vertices = (content.match(VERTEX_CELL_PATTERN) ?? []).length
  const edges = (content.match(EDGE_CELL_PATTERN) ?? []).length
  return { vertices, edges }
}
