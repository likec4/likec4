import type { LikeC4Model, LikeC4ViewModel } from '@likec4/core/model'
import type { aux, ProcessedView } from '@likec4/core/types'
import { test } from 'vitest'
import { fakeComputedView3Levels, fakeDiagram, fakeDiagram2 } from '../__mocks__/data'
import { generateMermaid } from '../mmd/generate-mmd'
import { generateMarkdown } from './generate-markdown'

type ViewSpec = {
  title: string
  sourcePath: string
  description?: string
  $view: ProcessedView
}

const mockView = ({ title, sourcePath, description, $view }: ViewSpec): LikeC4ViewModel<aux.Unknown> =>
  ({
    titleOrId: title,
    description: description
      ? { isEmpty: false, nonEmpty: true, md: description }
      : { isEmpty: true, nonEmpty: false, md: '' },
    $view: { ...$view, sourcePath },
  }) as unknown as LikeC4ViewModel<aux.Unknown>

const mockModel = (views: LikeC4ViewModel<aux.Unknown>[], project = { id: 'default', title: 'Acme Platform' }) =>
  ({
    projectId: project.id,
    project,
    views: () => views.values(),
  }) as unknown as LikeC4Model<aux.Unknown>

// Two source files; file A has two views (one described, one not), file B has one.
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
const model = mockModel([contextView, containersView, deploymentView])

test('One document per project', ({ expect }) => {
  const md = generateMarkdown(model)
  expect(typeof md).toBe('string')
  expect(md.match(/^# /gm)).toHaveLength(1)
  expect(md).toContain('# Acme Platform')
})

test('Every view becomes a section headed by its title', ({ expect }) => {
  const md = generateMarkdown(model)
  expect(md).toContain('### Context')
  expect(md).toContain('### Containers')
  expect(md).toContain('### Deployment')
})

test('Views are grouped by source file, in authored order', ({ expect }) => {
  const md = generateMarkdown(model)
  const headings = [...md.matchAll(/^#{2,3} (.+)$/gm)].map(m => m[1])
  expect(headings).toEqual([
    'views/system.c4',
    'Context',
    'Containers',
    'views/deployment.c4',
    'Deployment',
  ])
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
  const section = md.slice(md.indexOf('### Containers'), md.indexOf('## views/deployment.c4'))
  expect(section).toContain('```mermaid')
  // nothing but the heading between the title and the fence
  const between = section.slice('### Containers'.length, section.indexOf('```mermaid')).trim()
  expect(between).toBe('')
})

test('Output is reproducible', ({ expect }) => {
  expect(generateMarkdown(model)).toBe(generateMarkdown(model))
})

test('Full document snapshot', ({ expect }) => {
  expect(generateMarkdown(model)).toMatchSnapshot()
})
