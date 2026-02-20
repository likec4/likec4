import { type ViewsBuilder, Builder } from '@likec4/core/builder'
import { describe, expect as viExpect, it } from 'vitest'
import {
  materialize,
} from './base'
import { printViews } from './views'

const builder = Builder
  .specification({
    elements: {
      actor: {},
      system: {},
      component: {},
    },
    relationships: {
      likes: {},
      uses: {},
    },
    tags: {
      tag1: {},
      tag2: {},
    },
    metadataKeys: ['key1', 'key2'],
  })
  .model(({ system, component }, _) =>
    _(
      system('cloud'),
      component('cloud.frontend'),
      component('cloud.backend'),
      component('cloud.backend.api'),
    )
  )

const { views: { view, viewOf, views, $rules, $style, $include, $autoLayout, $exclude } } = builder.helpers()

type T = typeof builder['Types']

function expect(...builders: Array<(input: ViewsBuilder<T>) => any>) {
  const data = builder
    .with(
      // @ts-ignore
      views(...builders),
    )
    .build()
  return viExpect(
    materialize(
      printViews(data),
    ),
  )
}

describe('view', () => {
  it('should print element view', () => {
    expect(
      view(
        'index',
        $rules(
          $include('*'),
          $exclude('-> cloud.*'),
        ),
      ),
    ).toMatchInlineSnapshot(`
      "views {
        view index {
          include *
          exclude -> cloud.*
        }
      }"
    `)
  })

  it('should print element view properties', () => {
    expect(
      view(
        'index',
        {
          title: 'Index',
          tags: ['tag1'],
          description: {
            md: 'Cloud **description**',
          },
          links: [
            { url: '../some/relative' },
            { url: 'https://example.com', title: 'repo' },
          ],
        },
        $include('* -> cloud._'),
      ),
    ).toMatchInlineSnapshot(`
      "views {
        view index {
          #tag1
          title 'Index'
          description '''
            Cloud **description**
          '''
          link ../some/relative
          link https://example.com 'repo'

          include * -> cloud._
        }
      }"
    `)
  })

  it('should print multiple element views', () => {
    expect(
      view(
        'index',
        $include('* -> *'),
      ),
      view(
        'cloud',
        $rules(
          $include('*'),
          $exclude('cloud.** <-> cloud.frontend'),
        ),
      ),
    ).toMatchInlineSnapshot(`
      "views {
        view index {
          include * -> *
        }

        view cloud {
          include *
          exclude cloud.** <-> cloud.frontend
        }
      }"
    `)
  })

  it('should print autolayout rule', () => {
    expect(
      view(
        'index',
        $autoLayout('LR'),
      ),
    ).toMatchInlineSnapshot(`
      "views {
        view index {
          autoLayout LeftRight
        }
      }"
    `)

    expect(
      view(
        'index',
        $autoLayout('RL', { rank: 101, node: 102 }),
      ),
    ).toMatchInlineSnapshot(`
      "views {
        view index {
          autoLayout RightLeft 101 102
        }
      }"
    `)
  })

  it('should print scoped element view', () => {
    expect(
      viewOf(
        'index',
        'cloud.backend',
        {
          title: 'Index',
          tags: ['tag1'],
          description: {
            md: 'Cloud **description**',
          },
          links: [
            { url: '../some/relative' },
            { url: 'https://example.com', title: 'repo' },
          ],
        },
        $include('*'),
      ),
    ).toMatchInlineSnapshot(`
      "views {
        view index of cloud.backend {
          #tag1
          title 'Index'
          description '''
            Cloud **description**
          '''
          link ../some/relative
          link https://example.com 'repo'

          include *
        }
      }"
    `)
  })

  it('should print style rules', () => {
    expect(
      view(
        'index',
        $rules(
          $style('cloud.backend', {
            iconPosition: 'right',
            multiple: true,
          }),
          $style(['cloud.*', 'cloud._'], {
            color: 'primary',
            shape: 'bucket',
          }),
        ),
      ),
    ).toMatchInlineSnapshot(`
      "views {
        view index {
          style cloud.backend {
            iconPosition right
            multiple true
          }
          style cloud.*, cloud._ {
            shape bucket
            color primary
          }
        }
      }"
    `)
  })

  it('should print style rule notation', () => {
    expect(
      view(
        'index',
        $rules(
          $style('cloud.backend', {
            notation: 'multiline\ncomponent',
          }),
        ),
      ),
    ).toMatchInlineSnapshot(`
      "views {
        view index {
          style cloud.backend {
            notation ''
              multiline
              component
            ''
          }
        }
      }"
    `)
  })
})
