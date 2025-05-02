import { expectTypeOf, test } from 'vitest'
import type { LikeC4Model } from '../model/LikeC4Model'
import type { ParsedLikeC4ModelData } from '../types'
import { Builder } from './Builder'

test('Builder types - style 1', () => {
  const {
    model: {
      model,
      actor,
      system,
      component,
      activity,
      step,
      relTo,
    },
    deployment: {
      deployment,
      instanceOf,
      env,
      vm,
    },
    views: {
      deploymentView,
      views,
      view,
      viewOf,
      $rules,
      $include,
    },
    builder,
  } = Builder.forSpecification({
    elements: {
      actor: {
        style: {
          shape: 'person',
        },
      },
      system: {
        style: {
          size: 'lg',
        },
      },
      component: {},
    },
    deployments: {
      env: {},
      vm: {
        style: {
          textSize: 'sm',
        },
      },
    },
    relationships: {
      like: {},
      dislike: {},
    },
    tags: ['tag1', 'tag2', 'tag1'],
  })

  const m = builder
    .with(
      model(
        actor('alice'),
        actor('bob'),
        system('cloud').with(
          component('backend').with(
            activity('B', [
              ['-> cloud.backend', 'arsars'],
              ['<- alice', {
                title: 'arsarsar',
                tags: ['tag1'],
              }],
            ]),
            component('api'),
            component('db'),
          ),
          component('frontend').with(
            // activity('A').with(
            //   step('-> cloud.backend#B'),
            // ),
            relTo('cloud.backend.api'),
          ),
        ),
        activity('cloud#SPA', [
          step('-> cloud.backend'),
          step('-> cloud.backend', 'arsars'),
          '<- cloud.backend#B',
          step('<- cloud.backend#B', {
            title: 'arsarsar',
            tags: ['tag1'],
          }),
        ]),
      ),
      deployment(
        env('prod').with(
          vm('vm1'),
        ),
        env('prod.vm2'),
        env('dev').with(
          vm('vm1'),
          instanceOf('cloud.backend.api'),
          instanceOf(
            'wrong',
            // @ts-expect-error
            'non-existing',
          ),
          vm('vm2'),
        ),
      ),
      views(
        view(
          'view',
          // @ts-expect-error
          $include('wrong'),
        ), // rules inside
        view(
          'view',
          // @ts-expect-error #tag22 is not defined
          $include('cloud.backend', {
            where: 'tag is #tag22',
          }),
        ),
        // using with
        view('view').with(
          // @ts-expect-error
          $include('wrong'),
          // @ts-expect-error
          $style('wrong', { color: 'red' }),
        ),
      ),
      views(
        viewOf('view-of', 'cloud.backend.api'),
        // @ts-expect-error
        viewOf('view-of', 'wrong'),
        viewOf(
          'view-of',
          'cloud.backend.api',
          $rules(
            $include('* -> *'),
            // @ts-expect-error
            $include('wrong'),
          ),
        ),
        viewOf(
          'view-of',
          // @ts-expect-error
          '-cloud.backend.api',
          'Title',
        ),
        viewOf(
          'view-of',
          // @ts-expect-error
          '-cloud.backend.api',
          $rules(),
        ),
        viewOf(
          'view-of',
          'cloud.backend.api',
          { title: 'asdasd' },
          $rules(
            $include('* -> *'),
            // @ts-expect-error
            $include('wrong'),
          ),
        ),
      ),
      views(
        deploymentView(
          'deployment',
          $rules(
            // @ts-expect-error
            $include('pr'),
          ),
        ),
        deploymentView(
          'deployment',
          'Title',
          $rules(
            // @ts-expect-error
            $include('pr'),
          ),
        ),
        deploymentView('deployment').with(
          // @ts-expect-error
          $include('pr'),
        ),
      ),
    )

  expectTypeOf(m.Types.Fqn).toEqualTypeOf(
    '' as 'alice' | 'bob' | 'cloud' | 'cloud.backend' | 'cloud.backend.api' | 'cloud.backend.db' | 'cloud.frontend',
  )
  expectTypeOf(m.Types.ViewId).toEqualTypeOf(
    '' as 'view' | 'view-of' | 'deployment',
  )
  expectTypeOf(m.Types.DeploymentFqn).toEqualTypeOf(
    '' as 'prod' | 'dev' | 'prod.vm1' | 'prod.vm2' | 'dev.vm1' | 'dev.vm2' | 'dev.api' | 'dev.wrong',
  )
  expectTypeOf(m.Types.Activity).toEqualTypeOf(
    '' as 'cloud.backend#B' | 'cloud#SPA',
  )

  expectTypeOf(m.build()).toEqualTypeOf(
    {} as ParsedLikeC4ModelData<
      'actor' | 'system' | 'component',
      'like' | 'dislike',
      'tag1' | 'tag2',
      'alice' | 'bob' | 'cloud' | 'cloud.backend' | 'cloud.backend.api' | 'cloud.backend.db' | 'cloud.frontend',
      'view' | 'view-of' | 'deployment',
      'prod' | 'dev' | 'prod.vm1' | 'prod.vm2' | 'dev.vm1' | 'dev.vm2' | 'dev.api' | 'dev.wrong',
      'cloud.backend#B' | 'cloud#SPA'
    >,
  )

  expectTypeOf(m.toLikeC4Model()).toEqualTypeOf(
    {} as LikeC4Model.Computed<
      'alice' | 'bob' | 'cloud' | 'cloud.backend' | 'cloud.backend.api' | 'cloud.backend.db' | 'cloud.frontend',
      'cloud.backend#B' | 'cloud#SPA',
      'prod' | 'dev' | 'prod.vm1' | 'prod.vm2' | 'dev.vm1' | 'dev.vm2' | 'dev.api' | 'dev.wrong',
      'view' | 'view-of' | 'deployment'
    >,
  )
})

test('should build activities', () => {
  const {
    model: {
      model,
      component,
      activity,
    },
    builder,
  } = Builder.forSpecification({
    elements: {
      component: {},
    },
  })

  const m = builder.with(
    model(
      component('s1').with(
        activity('A'),
        component('c1'),
      ),
      component('s2').with(
        activity('B'),
        component('c2'),
      ),
      activity('s2.c2#C'),
    ),
  )

  expectTypeOf(m.Types.Fqn).toEqualTypeOf(
    '' as 's1' | 's2' | 's1.c1' | 's2.c2',
  )
  expectTypeOf(m.Types.Activity).toEqualTypeOf(
    '' as 's1#A' | 's2#B' | 's2.c2#C',
  )

  expectTypeOf(m.build()).toEqualTypeOf(
    {} as ParsedLikeC4ModelData<
      'component',
      never,
      never,
      's1' | 's2' | 's1.c1' | 's2.c2',
      never,
      never,
      's1#A' | 's2#B' | 's2.c2#C'
    >,
  )

  expectTypeOf(m.toLikeC4Model()).toEqualTypeOf(
    {} as LikeC4Model.Computed<
      's1' | 's2' | 's1.c1' | 's2.c2',
      's1#A' | 's2#B' | 's2.c2#C',
      never,
      never
    >,
  )
})

test('should build activities with steps (array)', () => {
  const {
    model: {
      model,
      component,
      activity,
      step,
    },
    builder: b,
  } = Builder.forSpecification({
    elements: {
      component: {},
    },
  })

  const m = b.with(
    model(
      component('s1').with(
        component('c1'),
      ),
      component('s2').with(
        component('c2'),
      ),
      activity('s2.c2#C', [
        step('-> s1.c1'),
        step('<- s1.c1'),
      ]),
    ),
  )

  expectTypeOf(m.Types.Fqn).toEqualTypeOf(
    '' as 's1' | 's2' | 's1.c1' | 's2.c2',
  )
  expectTypeOf(m.Types.Activity).toEqualTypeOf(
    '' as 's2.c2#C',
  )

  expectTypeOf(m.build()).toEqualTypeOf(
    {} as ParsedLikeC4ModelData<
      'component',
      never,
      never,
      's1' | 's2' | 's1.c1' | 's2.c2',
      never,
      never,
      's2.c2#C'
    >,
  )

  expectTypeOf(m.toLikeC4Model()).toEqualTypeOf(
    {} as LikeC4Model.Computed<
      's1' | 's2' | 's1.c1' | 's2.c2',
      's2.c2#C',
      never,
      never
    >,
  )
})

test('should build activities with steps (object)', () => {
  const {
    model: {
      model,
      component,
      activity,
      step,
    },
    builder: b,
  } = Builder.forSpecification({
    elements: {
      component: {},
    },
    relationships: {
      async: {},
    },
  })

  const m = b.with(
    model(
      component('s1'),
      component('s2').with(
        activity('B'),
      ),
      activity('s1#A', [
        ['-> s2#B', 'title1'],
        ['-> s2', {
          title: 'title2',
          kind: 'async',
        }],
        '<- s2',
      ]),
      // @ts-expect-error wrong target
      activity('s1#B', [
        '<- s4',
      ]),
    ),
  )

  expectTypeOf(m.Types.Fqn).toEqualTypeOf(
    '' as 's1' | 's2',
  )
  expectTypeOf(m.Types.Activity).toEqualTypeOf(
    '' as 's1#A' | 's2#B' | 's1#B',
  )

  expectTypeOf(m.build()).toEqualTypeOf(
    {} as ParsedLikeC4ModelData<
      'component',
      'async',
      never,
      's1' | 's2',
      never,
      never,
      's1#A' | 's2#B' | 's1#B'
    >,
  )

  expectTypeOf(m.toLikeC4Model()).toEqualTypeOf(
    {} as LikeC4Model.Computed<
      's1' | 's2',
      's1#A' | 's1#B' | 's2#B',
      never,
      never
    >,
  )
})
