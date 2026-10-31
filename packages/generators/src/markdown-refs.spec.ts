import { Builder } from '@likec4/core/builder'
import { LikeC4Model } from '@likec4/core/model'
import { markdownToHtml, markdownToText } from '@likec4/core/utils'
import { mapValues } from 'remeda'
import { describe, expect, it } from 'vitest'
import { generateDrawio } from './drawio/generate-drawio'
import { generateLikeC4 } from './likec4/generate-likec4'
import { generateMarkdown } from './markdown/generate-markdown'
import { generatePuml } from './puml/generate-puml'

/**
 * Refs in Markdown (`[[fqn]]`, `[[view:id]]`) are resolved to titles in exports,
 * and kept as is in the LikeC4 DSL (round-trip).
 */
const builder = Builder
  .specification({
    elements: {
      system: {},
      component: {},
    },
  })
  .model(({ system, component, rel }, _) =>
    _(
      system('cloud', 'Cloud').with(
        component('api', {
          title: 'Public API',
          description: { md: 'Serves [[cloud.ui]] and [[cloud.ui|the frontend]], see [[view:index]]' },
        }),
        component('ui', {
          title: 'Web UI',
          description: { md: 'Calls **[[cloud.api]]**, not [[cloud.missing]] or [[deployment:prod]]' },
        }),
      ),
      rel('cloud.ui', 'cloud.api', {
        title: 'requests',
        description: { md: 'Through [[cloud.api]]' },
      }),
    )
  )
  .views(({ view, $include }, _) =>
    _(
      view('index', {
        title: 'Landscape',
        description: { md: 'Overview of [[cloud]] and [[view:index|this view]]' },
      }).with(
        $include('cloud.*'),
      ),
    )
  )

const model = builder.toLikeC4Model()

describe('Markdown refs in exports', () => {
  it('PlantUML shows titles', () => {
    const puml = generatePuml(model.view('index'))
    expect(puml).toContain('Serves Web UI and the frontend, see Landscape')
    expect(puml).toContain('Calls Public API, not cloud.missing or prod')
    expect(puml).not.toContain('[[')
  })

  it('Draw.io shows titles and keeps the rest of markdown', () => {
    const drawio = generateDrawio(model.view('index'), { compressed: false })
    // visible cell value
    expect(drawio).toContain('Serves Web UI and the frontend, see Landscape')
    // round-trip style fields (url-encoded)
    expect(drawio).toContain(
      `likec4Description=${encodeURIComponent('Calls **Public API**, not cloud.missing or prod')}`,
    )
    expect(drawio).toContain(`likec4Description=${encodeURIComponent('Through Public API')}`)
    expect(drawio).toContain(`likec4ViewDescription=${encodeURIComponent('Overview of Cloud and this view')}`)
    expect(drawio).not.toContain('[[')
    expect(drawio).not.toContain(encodeURIComponent('[['))
  })

  it('Draw.io falls back to labels and targets without model', () => {
    const drawio = generateDrawio({ $view: model.view('index').$view }, { compressed: false })
    expect(drawio).toContain('Serves cloud.ui and the frontend, see index')
    expect(drawio).not.toContain('[[')
    expect(drawio).not.toContain(encodeURIComponent('[['))
  })

  it('Markdown export shows titles and keeps the rest of markdown', () => {
    // Markdown export skips views without source
    const withSources = LikeC4Model.create({
      ...model.$data,
      views: mapValues(model.$data.views, view => ({ ...view, sourcePath: 'views.c4' })),
    })
    const md = generateMarkdown(withSources)
    expect(md).toContain('Overview of Cloud and this view')
    expect(md).not.toContain('[[')
  })

  it('Markdown export escapes titles, so they render literally', () => {
    const title = '*Star* _under_ [x] A|B'
    const m = Builder
      .specification({ elements: { system: {} } })
      .model(({ system }, _) => _(system('api', title)))
      .views(({ view, $include }, _) =>
        _(
          view('index', {
            title: 'Index',
            description: {
              md: ['Uses [[api]]', '', '| Element | Note |', '| --- | --- |', '| [[api]] | ok |'].join('\n'),
            },
          }).with($include('*')),
        )
      )
      .toLikeC4Model()
    const md = generateMarkdown(LikeC4Model.create({
      ...m.$data,
      views: mapValues(m.$data.views, view => ({ ...view, sourcePath: 'views.c4' })),
    }))
    expect(md).toContain('Uses \\*Star\\* \\_under\\_ \\[x\\] A\\|B')
    // rendered with the core markdown pipeline
    const description = md.slice(md.indexOf('Uses'), md.indexOf('```mermaid'))
    expect(markdownToText(description)).toContain(`Uses ${title}`)
    const html = markdownToHtml(description)
    expect(html).toContain(`<td>${title}</td>`)
    expect(html.match(/<td>/g)).toHaveLength(2)
    expect(html).not.toMatch(/<(em|a)\b/)
  })

  it('LikeC4 DSL keeps refs as is', () => {
    const dsl = generateLikeC4(builder.build())
    expect(dsl).toContain('[[cloud.ui]] and [[cloud.ui|the frontend]], see [[view:index]]')
    expect(dsl).toContain('Calls **[[cloud.api]]**, not [[cloud.missing]] or [[deployment:prod]]')
    expect(dsl).toContain('Through [[cloud.api]]')
    expect(dsl).toContain('Overview of [[cloud]] and [[view:index|this view]]')
  })
})
