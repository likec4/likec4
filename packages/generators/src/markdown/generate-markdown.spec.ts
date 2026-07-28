import type { LikeC4Model, LikeC4ViewModel } from '@likec4/core/model'
import type { aux, ProcessedView } from '@likec4/core/types'
import { test } from 'vitest'
import { fakeComputedView3Levels, fakeDiagram, fakeDiagram2 } from '../__mocks__/data'
import { generateMermaid } from '../mmd/generate-mmd'
import { generateMarkdown } from './generate-markdown'

type ViewSpec = {
  title: string
  sourcePath?: string
  description?: string
  $view: ProcessedView
}

const mockView = ({ title, sourcePath, description, $view }: ViewSpec): LikeC4ViewModel<aux.Unknown> =>
  ({
    titleOrId: title,
    description: description
      ? { isEmpty: false, nonEmpty: true, md: description }
      : { isEmpty: true, nonEmpty: false, md: '' },
    $view: sourcePath !== undefined ? { ...$view, sourcePath } : { ...$view },
  }) as unknown as LikeC4ViewModel<aux.Unknown>

const mockModel = (views: LikeC4ViewModel<aux.Unknown>[], project = { id: 'default', title: 'Acme Platform' }) =>
  ({
    projectId: project.id,
    project,
    views: () => views.values(),
  }) as unknown as LikeC4Model<aux.Unknown>

const contextView = mockView({
  title: 'Context',
  sourcePath: 'views/system.c4',
  description: 'How the system fits its surroundings.',
  $view: fakeDiagram,
})
const containersView = mockView({
  title: 'Containers',
  sourcePath: 'views/system.c4',
  $view: fakeComputedView3Levels,
})
const deploymentView = mockView({
  title: 'Deployment',
  sourcePath: 'views/deployment.c4',
  description: 'Where it runs.',
  $view: fakeDiagram2,
})
const landscapeView = mockView({
  title: 'Landscape view',
  $view: fakeDiagram2,
})
const model = mockModel([contextView, containersView, deploymentView])
const modelWithLandscape = mockModel([landscapeView, contextView, containersView, deploymentView])

test('One document per project', ({ expect }) => {
  const md = generateMarkdown(model)
  expect(typeof md).toBe('string')
  expect(md.match(/^# /gm)).toHaveLength(1)
  expect(md).toContain('# Acme Platform')
})

test('Every authored view becomes a section directly under the project title, in authored order', ({ expect }) => {
  const md = generateMarkdown(model)
  const headings = [...md.matchAll(/^### (.+)$/gm)].map(m => m[1])
  expect(headings).toEqual(['Context', 'Containers', 'Deployment'])
  expect(md).not.toMatch(/^## /m)
})

test('Automatically generated views without a source file are omitted', ({ expect }) => {
  const md = generateMarkdown(modelWithLandscape)
  expect(md).not.toContain('Landscape view')
  const headings = [...md.matchAll(/^### (.+)$/gm)].map(m => m[1])
  expect(headings).toEqual(['Context', 'Containers', 'Deployment'])
})

test('Each section embeds the diagram from generateMermaid', ({ expect }) => {
  const md = generateMarkdown(model)
  const expected = generateMermaid(contextView).trimEnd()
  expect(md).toContain('```mermaid\n' + expected + '\n```')
})

test('A view with a description shows it as prose above the diagram', ({ expect }) => {
  const md = generateMarkdown(model)
  const descIdx = md.indexOf('How the system fits its surroundings.')
  const diagramIdx = md.indexOf('```mermaid')
  expect(descIdx).toBeGreaterThan(-1)
  expect(descIdx).toBeLessThan(diagramIdx)
})

test('A view without a description shows only heading and diagram', ({ expect }) => {
  const md = generateMarkdown(model)
  const section = md.slice(md.indexOf('### Containers'), md.indexOf('### Deployment'))
  expect(section).toContain('```mermaid')
  const between = section.slice('### Containers'.length, section.indexOf('```mermaid')).trim()
  expect(between).toBe('')
})

test('Output is reproducible', ({ expect }) => {
  expect(generateMarkdown(model)).toBe(generateMarkdown(model))
})

test('Full document snapshot', ({ expect }) => {
  expect(generateMarkdown(model)).toMatchSnapshot()
})
