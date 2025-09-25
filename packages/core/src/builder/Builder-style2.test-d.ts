import { expectTypeOf, test } from 'vitest'
import { LikeC4Model } from '../model/LikeC4Model'
import type { Aux, ParsedLikeC4ModelData, SpecAux } from '../types'
import { Builder } from './Builder'

test('Builder types - style 2', () => {
  const b1 = Builder
    .specification({
      elements: {
        actor: {
          style: {
            shape: 'person',
          },
        },
        system: {},
        component: {},
      },
      deployments: {
        env: {},
        vm: {},
      },
      relationships: {
        like: {},
        dislike: {},
      },
      tags: {
        tag1: {},
        tag2: {},
      },
      metadataKeys: ['key1', 'key2', 'key1', 'key3'],
    })
    .model(({ actor, system, component, relTo }, _) =>
      _(
        actor('alice'),
        actor('bob'),
        system('cloud').with(
          component('backend').with(
            component('api'),
            component('db', {
              metadata: {
                key1: ['value1'],
              },
            }),
          ),
          component('frontend').with(
            // @ts-expect-error
            relTo('non-existing'),
          ),
        ),
      )
    )
    .deployment(({ env, vm, instanceOf }, _) =>
      _(
        env('prod').with(
          vm('vm1'),
          vm('vm2'),
        ),
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
      )
    )
    // Test Element View
    .views(({ view, $include, $style }, _) =>
      _(
        // rules inside
        view(
          'view',
          // @ts-expect-error
          $include('wrong'),
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
      )
    )
    // Test Element View Of
    .views(({ viewOf, $rules, $include }, _) =>
      _(
        viewOf('view-of', 'cloud.backend'),
        // @ts-expect-error
        viewOf('view-of', 'wrong'),
        viewOf(
          'view-of',
          'cloud.backend.api',
          $rules(
            // @ts-expect-error
            $include('wrong'),
          ),
        ),
        viewOf(
          'view-of',
          'cloud.backend.api',
          $rules(
            // @ts-expect-error
            $include('wrong'),
          ),
        ).with(
          $include('* -> alice.*'),
          // @ts-expect-error
          $include('wrong'),
        ),
        viewOf(
          'view-of',
          // @ts-expect-error
          'cloud.backensd.api',
          'Title',
        ).with(
          $include('* -> alice.*'),
          // @ts-expect-error
          $include('wrong'),
        ),
      )
    )
    // Test Deployment View
    .views(({ deploymentView, $rules, $include }, _) =>
      _(
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
      )
    )

  expectTypeOf(b1.Types.Fqn).toEqualTypeOf<
    'alice' | 'bob' | 'cloud' | 'cloud.backend' | 'cloud.backend.api' | 'cloud.backend.db' | 'cloud.frontend'
  >()
  expectTypeOf(b1.Types.ViewId).toEqualTypeOf<
    'view' | 'view-of' | 'deployment'
  >()
  expectTypeOf(b1.Types.DeploymentFqn).toEqualTypeOf<
    'prod' | 'dev' | 'prod.vm1' | 'prod.vm2' | 'dev.vm1' | 'dev.vm2' | 'dev.api' | 'dev.wrong'
  >()
  expectTypeOf(b1.Types.MetadataKey).toEqualTypeOf<'key1' | 'key2' | 'key3'>()

  expectTypeOf(b1.build()).toEqualTypeOf<
    ParsedLikeC4ModelData<
      Aux<
        'parsed',
        'alice' | 'bob' | 'cloud' | 'cloud.backend' | 'cloud.backend.api' | 'cloud.backend.db' | 'cloud.frontend',
        'prod' | 'dev' | 'prod.vm1' | 'prod.vm2' | 'dev.vm1' | 'dev.vm2' | 'dev.api' | 'dev.wrong',
        'view' | 'view-of' | 'deployment',
        'from-builder',
        SpecAux<
          'actor' | 'system' | 'component',
          'env' | 'vm',
          'like' | 'dislike',
          'tag1' | 'tag2',
          'key1' | 'key2' | 'key3'
        >
      >
    >
  >()

  expectTypeOf(b1.build({ id: 'project-a' })).toEqualTypeOf<
    ParsedLikeC4ModelData<
      Aux<
        'parsed',
        'alice' | 'bob' | 'cloud' | 'cloud.backend' | 'cloud.backend.api' | 'cloud.backend.db' | 'cloud.frontend',
        'prod' | 'dev' | 'prod.vm1' | 'prod.vm2' | 'dev.vm1' | 'dev.vm2' | 'dev.api' | 'dev.wrong',
        'view' | 'view-of' | 'deployment',
        'project-a', // <----
        SpecAux<
          'actor' | 'system' | 'component',
          'env' | 'vm',
          'like' | 'dislike',
          'tag1' | 'tag2',
          'key1' | 'key2' | 'key3'
        >
      >
    >
  >()

  expectTypeOf(b1.toLikeC4Model({ id: 'project-a' })).toEqualTypeOf<
    LikeC4Model<
      Aux<
        'computed',
        'alice' | 'bob' | 'cloud' | 'cloud.backend' | 'cloud.backend.api' | 'cloud.backend.db' | 'cloud.frontend',
        'prod' | 'dev' | 'prod.vm1' | 'prod.vm2' | 'dev.vm1' | 'dev.vm2' | 'dev.api' | 'dev.wrong',
        'view' | 'view-of' | 'deployment',
        'project-a', // <----
        SpecAux<
          'actor' | 'system' | 'component',
          'env' | 'vm',
          'like' | 'dislike',
          'tag1' | 'tag2',
          'key1' | 'key2' | 'key3'
        >
      >
    >
  >()

  const m = b1.toLikeC4Model()
  expectTypeOf(m).toEqualTypeOf<
    LikeC4Model<
      Aux<
        'computed',
        'alice' | 'bob' | 'cloud' | 'cloud.backend' | 'cloud.backend.api' | 'cloud.backend.db' | 'cloud.frontend',
        'prod' | 'dev' | 'prod.vm1' | 'prod.vm2' | 'dev.vm1' | 'dev.vm2' | 'dev.api' | 'dev.wrong',
        'view' | 'view-of' | 'deployment',
        'from-builder',
        SpecAux<
          'actor' | 'system' | 'component',
          'env' | 'vm',
          'like' | 'dislike',
          'tag1' | 'tag2',
          'key1' | 'key2' | 'key3'
        >
      >
    >
  >()

  const b2 = Builder.specification(m.specification)
    .model(({ actor }, _) =>
      _(
        actor('alice2'),
        actor('bob2'),
      )
    )
    .deployment(({ env, instanceOf }, _) =>
      _(
        env('out').with(
          instanceOf('bob2'),
        ),
      )
    )
  expectTypeOf(b2.build()).toEqualTypeOf<
    ParsedLikeC4ModelData<
      Aux<
        'parsed',
        'alice2' | 'bob2',
        'out' | 'out.bob2',
        never,
        'from-builder',
        SpecAux<
          'actor' | 'system' | 'component',
          'env' | 'vm',
          'like' | 'dislike',
          'tag1' | 'tag2',
          'key1' | 'key2' | 'key3'
        >
      >
    >
  >()
})
