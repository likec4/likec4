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
                // @ts-expect-error
                unknown: ['value1'],
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
    // Test one view
    .views(_ =>
      _.view(
        'one-view-per-block',
        _.$rules(
          // @ts-expect-error
          _.$include('wrong'),
        ),
      )
    )
    // Test Element View Of
    .views(({ viewOf, $rules, $include }, _) =>
      _(
        viewOf('view-of', 'cloud.backend').with(
          // @ts-expect-error
          $include('wrong'),
        ),
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
        ),
        viewOf(
          'view-of',
          // @ts-expect-error
          'cloud.backensd.api',
          'Title',
          $rules(
            $include('* -> alice.*'),
            // @ts-expect-error
            $include('wrong'),
          ),
        ),
      )
    )
    // Test Deployment View
    .views(({ deploymentView, $rules, $include, $exclude }, _) =>
      _(
        deploymentView(
          'deployment',
          $rules(
            $include('prod.*'),
            $exclude('dev.vm1._'),
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
          $include('prod.*'),
          // @ts-expect-error
          $include('pr'),
        ),
      )
    )
    // Test Dynamic View
    .views(({ dynamicView, $step, $rules }, _) =>
      _(
        dynamicView('dynamic-a').with(
          $step('cloud.backend', 'cloud'),
          $step.loop(
            'alice -> alice',
            'bob -> bob',
            $step('alice -> cloud.backend'),
            $step.opt(
              'cloud.frontend -> cloud.frontend',
              'cloud -> cloud.backend',
            ),
          ),
          // @ts-expect-error
          $step('a -> b'),
          $step.try({
            try: [
              'alice -> bob',
              'alice -> cloud.backend',
              $step('bob', 'cloud'),
            ],
            catch: [
              $step.loop(
                $step('bob', 'cloud'),
                'bob -> alice',
                'bob -> cloud.backend',
                // @ts-expect-error
                'a -> b',
              ),
              $step.break(
                $step('cloud -> bob', {
                  title: 'Send error',
                }),
              ),
            ],
            finally: [
              $step('cloud -> cloud.backend'),
            ],
          }),
          $step.alt(
            $step.when(
              'alice -> cloud',
              $step('alice -> cloud.backend'),
            ),
            $step.if(
              'bob -> alice',
              $step.loop(
                $step('alice -> cloud'),
              ),
              'bob -> bob',
            ),
            // @ts-expect-error
            $step.else('a -> b'),
          ),
          $step('cloud.backend', 'bob'),
          // @ts-expect-error
          $step('a -> b'),
        ),
        dynamicView(
          'dynamic-b',
          {
            tags: [
              'tag2',
              // @ts-expect-error
              'tag12',
            ],
          },
          $rules(
            $step('cloud.backend', 'alice'),
            $step('cloud.backend -> alice'),
            $step.loop(
              'cloud.backend.api -> cloud',
              'cloud.backend.api -> cloud.backend',
              $step('cloud.backend -> cloud.backend.db'),
              'cloud.backend.db -> cloud.backend.api',
            ),
            $step.series(
              'alice',
              '-> cloud.frontend',
              // @ts-expect-error
              '-> B',
              '-> cloud.backend.api',
            ),
            $step.parallel(
              'cloud.backend -> cloud.backend.db',
              $step('alice -> cloud.frontend'),
              'cloud.backend.db -> cloud.backend.api',
            ),
            // @ts-expect-error
            $step('a -> b'),
          ),
        ),
      )
    )

  expectTypeOf(b1.Types.Fqn).toEqualTypeOf<
    'alice' | 'bob' | 'cloud' | 'cloud.backend' | 'cloud.backend.api' | 'cloud.backend.db' | 'cloud.frontend'
  >()
  expectTypeOf(b1.Types.ViewId).toEqualTypeOf<
    'view' | 'view-of' | 'deployment' | 'one-view-per-block' | 'dynamic-a' | 'dynamic-b'
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
        'view' | 'view-of' | 'deployment' | 'one-view-per-block' | 'dynamic-a' | 'dynamic-b',
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
        'view' | 'view-of' | 'deployment' | 'one-view-per-block' | 'dynamic-a' | 'dynamic-b',
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
        'view' | 'view-of' | 'deployment' | 'one-view-per-block' | 'dynamic-a' | 'dynamic-b',
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

  expectTypeOf(b1.toLikeC4Model('inline-project-a')).toEqualTypeOf<
    LikeC4Model<
      Aux<
        'computed',
        'alice' | 'bob' | 'cloud' | 'cloud.backend' | 'cloud.backend.api' | 'cloud.backend.db' | 'cloud.frontend',
        'prod' | 'dev' | 'prod.vm1' | 'prod.vm2' | 'dev.vm1' | 'dev.vm2' | 'dev.api' | 'dev.wrong',
        'view' | 'view-of' | 'deployment' | 'one-view-per-block' | 'dynamic-a' | 'dynamic-b',
        'inline-project-a', // <----
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
        'view' | 'view-of' | 'deployment' | 'one-view-per-block' | 'dynamic-a' | 'dynamic-b',
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

test('Builder tags - style 2', () => {
  const b1 = Builder
    .specification({
      elements: {
        element: {},
      },
      tags: ['tag1', 'tag2'],
    })
    .model(({ element }, _) =>
      _(
        element(
          'a',
          {
            tags: ['tag1', 'tag2'],
          },
        ).with(
          element('b', {
            // @ts-expect-error unknown tag
            tags: ['unknown'],
          }),
        ),
      )
    )

  const b2 = b1
    .model(({ element, relTo }, _) =>
      _(
        element('a.b2').with(
          element('c'),
          relTo('a.b', {
            // @ts-expect-error
            tags: ['o'],
          }),
          // @ts-expect-error unknown element
          relTo('ac'),
        ),
      )
    )

  expectTypeOf(b1.build()).toEqualTypeOf<
    ParsedLikeC4ModelData<
      Aux<
        'parsed',
        'a' | 'a.b',
        never,
        never,
        'from-builder',
        SpecAux<
          'element',
          never,
          never,
          'tag1' | 'tag2',
          never
        >
      >
    >
  >()

  expectTypeOf(b2.build()).toEqualTypeOf<
    ParsedLikeC4ModelData<
      Aux<
        'parsed',
        'a' | 'a.b' | 'a.b2' | 'a.b2.c',
        never,
        never,
        'from-builder',
        SpecAux<
          'element',
          never,
          never,
          'tag1' | 'tag2',
          never
        >
      >
    >
  >()
})
