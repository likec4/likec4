import type { LikeC4ViewModel } from '@likec4/core/model'
import { computeColorValues, LikeC4Styles } from '@likec4/core/styles'
import type { aux, ProcessedView } from '@likec4/core/types'
import { test, vi } from 'vitest'
import {
  fakeComputedView3Levels,
  fakeComputedViewWithAllShapes,
  fakeComputedViewWithGroups,
  fakeDiagram,
  fakeDiagram2,
} from '../__mocks__/data'
import { mockModelStyles, withEdgeStyles } from '../__mocks__/view-model'
import { generateMermaid } from './generate-mmd'

const mockViewModel = vi.fn(function($view: ProcessedView) {
  return {
    titleOrId: $view.title || $view.id,
    $view: withEdgeStyles($view),
    $model: mockModelStyles,
  } as unknown as LikeC4ViewModel<aux.Unknown>
})

test('generate mermaid - fakeDiagram', ({ expect }) => {
  expect(generateMermaid(mockViewModel(fakeDiagram))).toMatchSnapshot()
})

test('generate mermaid - fakeDiagram2', ({ expect }) => {
  expect(generateMermaid(mockViewModel(fakeDiagram2))).toMatchSnapshot()
})

test('generate mermaid - fakeComputedView 3 Levels', ({ expect }) => {
  expect(generateMermaid(mockViewModel(fakeComputedView3Levels))).toMatchSnapshot()
})

test('generate mermaid - AllShapes', ({ expect }) => {
  expect(generateMermaid(mockViewModel(fakeComputedViewWithAllShapes))).toMatchSnapshot()
})

test('generate mermaid - view with group', ({ expect }) => {
  const mmd = generateMermaid(mockViewModel(fakeComputedViewWithGroups))
  expect(mmd).toMatchSnapshot()
  expect(mmd).not.toContain('@gr1')
  expect(mmd).toContain('subgraph _gr1["`Infra`"]')
  expect(mmd).toContain('_gr1.Auth@{ shape: rectangle, label: "Auth" }')
  expect(mmd).toContain('_gr1.Portal@{ shape: rectangle, label: "Portal" }')
  expect(mmd).toContain('App -. "`signs in`" .-> _gr1.Auth')
})

test('generate mermaid - element colors as classDef and class', ({ expect }) => {
  const [root, ...children] = fakeComputedViewWithAllShapes.nodes
  const view = {
    ...fakeComputedViewWithAllShapes,
    nodes: [root, ...children.map((node, index) => ({ ...node, color: index % 2 === 0 ? 'amber' : 'green' }))],
  } as ProcessedView
  const { amber, green } = LikeC4Styles.DEFAULT.theme.colors
  const mmd = generateMermaid(mockViewModel(view))
  expect(mmd).toContain(
    `classDef amber fill:${amber.elements.fill},stroke:${amber.elements.stroke},color:${amber.elements.hiContrast}`,
  )
  expect(mmd).toContain('class Root.El1,Root.El3,Root.El5,Root.El7,Root.El9,Root.El11 amber')
  expect(mmd).toContain(
    `classDef green fill:${green.elements.fill},stroke:${green.elements.stroke},color:${green.elements.hiContrast}`,
  )
  // Root.El2 is the person shape, an icon whose label sits outside the fill: it keeps Mermaid's colors
  expect(mmd).toContain('class Root.El4,Root.El6,Root.El8,Root.El10 green')
  // A subgraph keeps Mermaid's own style: only leaf nodes get a class
  expect(mmd).not.toMatch(/class [^\n]*\bRoot\b(?!\.)/)
})

test('generate mermaid - custom colors get distinct class names, never Mermaid\'s default', ({ expect }) => {
  const [root, ...children] = fakeComputedViewWithAllShapes.nodes
  const colors = ['brand-blue', 'brand_blue', 'default']
  const view = {
    ...fakeComputedViewWithAllShapes,
    nodes: [root, ...children.map((node, index) => ({ ...node, color: colors[index % colors.length] }))],
  } as ProcessedView
  const $styles = LikeC4Styles.from(undefined, {
    'brand-blue': computeColorValues('#1d4ed8'),
    'brand_blue': computeColorValues('#60a5fa'),
    'default': computeColorValues('#f59e0b'),
  })
  const mmd = generateMermaid({
    titleOrId: view.title || view.id,
    $view: withEdgeStyles(view),
    $model: { $styles },
  } as unknown as LikeC4ViewModel<aux.Unknown>)
  expect(mmd).toContain(`classDef brand_blue fill:${$styles.colors('brand-blue').elements.fill},`)
  expect(mmd).toContain(`classDef brand_blue_2 fill:${$styles.colors('brand_blue').elements.fill},`)
  expect(mmd).toContain(`classDef default_2 fill:${$styles.colors('default').elements.fill},`)
  expect(mmd).not.toMatch(/classDef default /)
})

test('generate mermaid - relationship line and color as arrow and linkStyle', ({ expect }) => {
  const [solid, dashed, dotted] = fakeComputedViewWithAllShapes.edges
  const view = {
    ...fakeComputedViewWithAllShapes,
    edges: [
      { ...solid, line: 'solid', color: 'red' },
      { ...dashed, line: 'dashed', color: 'gray' },
      { ...dotted, line: 'dotted', color: 'red' },
    ],
  } as ProcessedView
  const { red, gray } = LikeC4Styles.DEFAULT.theme.colors
  const mmd = generateMermaid(mockViewModel(view))
  expect(mmd).toContain('Root.El1 -- "`With \'Label\'`" --> Root.El2')
  expect(mmd).toContain('Root.El5 -.-> Root.El6')
  // Edges of one style share a statement, addressed by the order they are printed in
  expect(mmd).toContain(`linkStyle 0,2 stroke:${red.relationships.line}\n`)
  expect(mmd).toContain(`linkStyle 1 stroke:${gray.relationships.line},stroke-dasharray:8 4\n`)
})
