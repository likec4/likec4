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
            component('api'),
            component('db'),
          ),
          component('frontend').with(
            relTo('cloud.backend.api'),
          ),
        ),
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

  expectTypeOf(m.build()).toEqualTypeOf(
    {} as ParsedLikeC4ModelData<
      'actor' | 'system' | 'component',
      'like' | 'dislike',
      'tag1' | 'tag2',
      'alice' | 'bob' | 'cloud' | 'cloud.backend' | 'cloud.backend.api' | 'cloud.backend.db' | 'cloud.frontend',
      'view' | 'view-of' | 'deployment',
      'prod' | 'dev' | 'prod.vm1' | 'prod.vm2' | 'dev.vm1' | 'dev.vm2' | 'dev.api' | 'dev.wrong'
    >,
  )

  expectTypeOf(m.toLikeC4Model()).toEqualTypeOf(
    {} as LikeC4Model.Computed<
      'alice' | 'bob' | 'cloud' | 'cloud.backend' | 'cloud.backend.api' | 'cloud.backend.db' | 'cloud.frontend',
      'prod' | 'dev' | 'prod.vm1' | 'prod.vm2' | 'dev.vm1' | 'dev.vm2' | 'dev.api' | 'dev.wrong',
      'view' | 'view-of' | 'deployment'
    >,
  )
})
