import { describe, it } from 'vitest'
import { Builder } from '../../../builder'
import { TestHelper } from './TestHelper'

describe('Compute Element View with activities', () => {
  const builder = Builder
    .specification({
      elements: {
        el: {},
      },
      tags: ['tag1', 'tag2', 'tag3'],
    })
    .model(({ el, activity, step }, _) =>
      _(
        el('customer'),
        el('cloud'),
        el('cloud.frontend'),
        el('cloud.frontend.dashboard'),
        el('cloud.backend'),
        el('cloud.backend.api'),
        activity('customer#OPEN'),
        activity('cloud.frontend.dashboard#LOAD', {
          steps: [
            step('-> cloud.backend.api', { tags: 'tag1' }),
            step('<- cloud.backend.api', {
              tags: ['tag2'],
            }),
          ],
        }),
        activity('customer#OPEN', [
          ['-> cloud.frontend.dashboard#LOAD', {
            tags: ['tag1', 'tag2', 'tag3'],
          }],
        ]),
      )
    )

  const { $include, $exclude, $rules } = TestHelper

  it('should compute "*"', ({ expect }) => {
    TestHelper.from(builder, expect)
      .expectComputedView(
        $include('*'),
      )
      .toHave({
        nodes: [
          'customer',
          'cloud',
        ],
        edges: [
          'customer -> cloud',
        ],
      })
  })

  it('should merge with regular relations', ({ expect }) => {
    const t = TestHelper.from(
      builder.clone()
        .model(m =>
          m._(
            m.rel('customer', 'cloud.frontend'),
          )
        ),
      expect,
    )

    let m = t.processPredicates(
      $include('*'),
    )

    t.expect(m).toHaveElements(
      'customer',
      'cloud',
    )
    t.expect(m).toHaveConnections({
      'customer -> cloud': [
        'customer -> cloud.frontend',
        'customer#OPEN -> cloud.frontend.dashboard#LOAD',
      ],
    })
  })

  it('should compute "cloud.*"', ({ expect }) => {
    TestHelper.from(builder.clone(), expect)
      .expectComputedView(
        $include('cloud.*'),
      )
      .toHave({
        edges: [
          'cloud.frontend -> cloud.backend',
          'cloud.backend -> cloud.frontend',
        ],
        nodes: [
          'cloud.frontend',
          'cloud.backend',
        ],
      })
  })

  it('should compute "include *" of "cloud"', ({ expect }) => {
    TestHelper
      .from(
        builder
          .clone()
          .views(_ =>
            _.viewOf('1', 'cloud').with(
              $include('*'),
            )
          ),
        expect,
      )
      .expectView('1')
      .toHave({
        edges: [
          'customer -> cloud.frontend',
          'cloud.frontend -> cloud.backend',
          'cloud.backend -> cloud.frontend',
        ],
        nodes: [
          'customer',
          'cloud',
          'cloud.frontend',
          'cloud.backend',
        ],
      })
  })

  it('should compute "include * -> *"', ({ expect }) => {
    TestHelper.from(builder, expect)
      .expectComputedView(
        $include('* -> *'),
      )
      .toHave({
        edges: [
          'customer -> cloud',
        ],
        nodes: [
          'customer',
          'cloud',
        ],
      })
  })

  it('should compute "include * -> *" by #tag1', ({ expect }) => {
    TestHelper.from(builder, expect)
      .expectComputedView(
        $include('* -> *', {
          where: 'tag is #tag1',
        }),
      )
      .toHave({
        edges: [
          'customer -> cloud.frontend.dashboard',
          'cloud.frontend.dashboard -> cloud.backend.api',
        ],
        nodes: [
          'customer',
          'cloud.frontend.dashboard',
          'cloud.backend.api',
        ],
      })
  })

  it('should compute "include * -> *" by is not #tag1', ({ expect }) => {
    TestHelper.from(builder, expect)
      .expectComputedView(
        $include('* -> *', {
          where: 'tag is not #tag1',
        }),
      )
      .toHave({
        edges: [
          'cloud.backend.api -> cloud.frontend.dashboard',
        ],
        nodes: [
          'cloud.backend.api',
          'cloud.frontend.dashboard',
        ],
      })
  })

  it('should compute "include * -> *" by #tag2', ({ expect }) => {
    TestHelper.from(builder, expect)
      .expectComputedView(
        $include('* -> *', {
          where: 'tag is #tag2',
        }),
      )
      .toHave({
        edges: [
          'customer -> cloud.frontend.dashboard',
          'cloud.backend.api -> cloud.frontend.dashboard',
        ],
        nodes: [
          'customer',
          'cloud.backend.api',
          'cloud.frontend.dashboard',
        ],
      })
  })
  it('should compute "include * -> *" by #tag3', ({ expect }) => {
    TestHelper.from(builder, expect)
      .expectComputedView(
        $include('* -> *', {
          where: 'tag is #tag3',
        }),
      )
      .toHave({
        edges: [
          'customer -> cloud.frontend.dashboard',
        ],
        nodes: [
          'customer',
          'cloud.frontend.dashboard',
        ],
      })
  })
})
