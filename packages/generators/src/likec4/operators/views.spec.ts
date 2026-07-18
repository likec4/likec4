import { type ViewsBuilder, Builder } from '@likec4/core/builder'
import { describe, expect as viExpect, it } from 'vitest'
import {
  materialize,
  withctx,
} from './base'
import { views as viewsOp } from './views'

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
  .model(({ actor, system, component }, _) =>
    _(
      actor('customer'),
      system('cloud'),
      component('cloud.frontend'),
      component('cloud.backend'),
      component('cloud.backend.api'),
    )
  )

const {
  views: {
    view,
    viewOf,
    deploymentView,
    dynamicView,
    $step,
    views,
    $rules,
    $style,
    $include,
    $autoLayout,
    $exclude,
    $includeAncestors,
  },
} = builder.helpers()

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
      withctx(data.views, viewsOp()),
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
        $rules(
          $include('*'),
          $exclude('cloud.frontend'),
        ),
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
          exclude cloud.frontend
        }
      }"
    `)
  })

  it('should print view rules', () => {
    expect(
      view(
        'index',
        $rules(
          $include('*', 'cloud', '* -> cloud._'),
          $style('cloud.backend', {
            iconPosition: 'right',
            multiple: true,
          }),
          $include('* -> *', '* <-> cloud._', 'cloud.backend.api'),
          $style(['cloud.*', 'cloud._'], {
            color: 'primary',
            shape: 'bucket',
          }),
        ),
      ),
    ).toMatchInlineSnapshot(`
      "views {
        view index {
          include
            *,
            cloud,
            * -> cloud._
          
          style cloud.backend {
            iconPosition right
            multiple true
          }
          include
            * -> *,
            * <-> cloud._,
            cloud.backend.api
          
          style cloud.*, cloud._ {
            shape bucket
            color primary
          }
        }
      }"
    `)
  })

  it('should print view rules where', () => {
    expect(
      view(
        'index',
        $rules(
          $include('* -> *', {
            where: 'source.tag is #tag1',
          }),
          $include('cloud.backend'),
          $include('*', {
            where: {
              and: [
                'kind is not system',
                'tag is #tag1',
              ],
            },
          }),
        ),
      ),
    ).toMatchInlineSnapshot(`
      "views {
        view index {
          include * -> *
            where
              source.tag is #tag1
          
          include cloud.backend
          include *
            where
              kind is not system
              and tag is #tag1
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
            notation '
              multiline
              component
            '
          }
        }
      }"
    `)
  })

  describe('includeAncestors', () => {
    it('should print includeAncestors true', () => {
      expect(
        deploymentView(
          'deployment',
          $rules(
            $includeAncestors(true),
          ),
        ),
      ).toMatchInlineSnapshot(`
        "views {
          deployment view deployment {
            includeAncestors true
          }
        }"
      `)
    })

    it('should print includeAncestors false', () => {
      expect(
        deploymentView(
          'deployment',
          $rules(
            $includeAncestors(false),
          ),
        ),
      ).toMatchInlineSnapshot(`
        "views {
          deployment view deployment {
            includeAncestors false
          }
        }"
      `)
    })
  })

  describe('dynamic view', () => {
    it('should print steps', () => {
      expect(
        dynamicView(
          'test',
          $rules(
            $step('cloud.frontend -> cloud.backend.api', {
              title: 'Test step',
              with: {
                color: 'gray',
                notes: {
                  md: '**MD**',
                },
              },
            }),
            $step.loop(
              'cloud.backend.api -> cloud.backend.api',
            ),
          ),
        ),
      ).toMatchInlineSnapshot(`
        "views {
          dynamic view test {
            cloud.frontend -> cloud.backend.api 'Test step' {
              notes '''
                **MD**
              '''
              color gray
            }
            loop {
              cloud.backend.api -> cloud.backend.api
            }
          }
        }"
      `)
    })

    it('should print step series', () => {
      expect(
        dynamicView(
          'test',
          $rules(
            $step.series(
              'customer',
              '-> cloud.frontend',
              '-> cloud.backend.api',
              '-> cloud.frontend',
            ),
          ),
        ),
      ).toMatchInlineSnapshot(`
        "views {
          dynamic view test {
            customer
              -> cloud.frontend
              -> cloud.backend.api
              -> cloud.frontend
          }
        }"
      `)
    })

    it('should print try catch', () => {
      expect(
        dynamicView(
          'test',
          $rules(
            $step.try({
              try: [
                'cloud -> cloud',
                'cloud.frontend -> cloud.backend',
              ],
              catch: [
                'cloud.backend -> cloud.backend',
              ],
              finally: [
                'cloud.backend -> cloud.backend',
              ],
            }),
          ),
        ),
      ).toMatchInlineSnapshot(`
        "views {
          dynamic view test {
            try {
              cloud -> cloud
              cloud.frontend -> cloud.backend
            } catch {
              cloud.backend -> cloud.backend
            } finally {
              cloud.backend -> cloud.backend
            }
          }
        }"
      `)
    })

    it('should print alt', () => {
      expect(
        dynamicView(
          'test',
          $rules(
            $step('cloud', 'cloud', {
              with: {
                kind: 'likes',
              },
            }),
            $step.alt(
              $step.when(
                'cloud -> cloud',
                'cloud.frontend -> cloud.backend',
              ),
              $step.if(
                'cloud.frontend -> cloud.backend',
              ),
              $step.else(
                'cloud.backend -> cloud.backend',
              ),
            ),
          ),
        ),
      ).toMatchInlineSnapshot(`
        "views {
          dynamic view test {
            cloud -[likes]-> cloud
            alt {
              when {
                cloud -> cloud
                cloud.frontend -> cloud.backend
              }
              if {
                cloud.frontend -> cloud.backend
              }
              else {
                cloud.backend -> cloud.backend
              }
            }
          }
        }"
      `)
    })
  })
})
