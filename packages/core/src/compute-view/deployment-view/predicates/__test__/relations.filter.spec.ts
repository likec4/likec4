import { describe, it } from 'vitest'
import { Builder } from '../../../../builder'
import { TestHelper } from '../../__test__/TestHelper'

describe('RelationPredicate', () => {
  const builder = Builder
    .specification({
      elements: {
        el: {},
      },
      deployments: {
        node: {},
      },
      tags: ['next', 'old', 'alpha'],
    })
    .model(({ el, rel }, _) =>
      _(
        el('client'),
        el('cloud'),
        el('cloud.ui', { tags: ['next'] }),
        el('cloud.backend'),
        el('cloud.backend.api'),
        el('cloud.db'),
        rel('client', 'cloud.ui'),
        rel('cloud.ui', 'cloud.backend.api', { tags: ['next'] }),
        rel('cloud.backend.api', 'cloud.db', { tags: ['old'] }),
      )
    )

  const { $include } = TestHelper

  describe('* -> *', () => {
    const t = TestHelper.from(builder.deployment((_, deploymentModel) =>
      deploymentModel(
        _.node('a'),
        _.node('a.b'),
        _.node('a.b.c').with(
          _.instanceOf('cloud.ui'),
        ),
        _.node('a.b.d').with(
          _.instanceOf('api', 'cloud.backend.api', { tags: ['alpha'] }),
        ),
        _.node('a.b.d.e').with(
          _.instanceOf('cloud.db'),
        ),
      )
    ))

    describe('* -> instance where', () => {
      it('should include realtion when porperties match', () => {
        t.expectComputedView(
          $include('* -> a.b.d.api', { where: 'tag is #next' }),
        ).toHave(
          {
            nodes: [
              'a.b.c',
              'a.b.d',
              'a.b.d.api',
            ],
            edges: [
              'a.b.c -> a.b.d.api',
            ],
          },
        )
      })

      it('should not include realtion when properties do not match', () => {
        t.expectComputedView(
          $include('* -> a.b.d.api', { where: 'tag is not #next' }),
        ).toHave(
          {
            nodes: [],
            edges: [],
          },
        )
      })
    })
  })

  describe('node -> *', () => {
    const t = TestHelper.from(builder.deployment((_, deploymentModel) =>
      deploymentModel(
        _.node('a'),
        _.node('a.b1'),
        _.node('a.b1.c').with(
          _.instanceOf('cloud.ui'),
          _.instanceOf('cloud.backend.api'),
        ),
        _.node('a.b2').with(
          _.instanceOf('cloud.db'),
        ),
        _.node('a.b2.c').with(
          _.instanceOf('cloud.ui'),
          _.instanceOf('cloud.backend.api'),
        ),
      )
    ))

    describe('node -> * where', () => {
      it('should include realtion when porperties match', () => {
        t.expect(t.computeView(
          $include('a.b2.c -> *', { where: 'tag is #old' }),
        )).toHave({
          nodes: [
            'a.b2.c',
            'a.b2.db',
          ],
          edges: [
            'a.b2.c -> a.b2.db',
          ],
        })
      })

      it('should not include realtion when properties do not match', () => {
        t.expect(t.computeView(
          $include('a.b2.c -> *', { where: 'tag is not #old' }),
        )).toHave({
          nodes: [],
          edges: [],
        })
      })
    })

    describe('node -> node where', () => {
      const t = TestHelper.from(builder.deployment((_, deploymentModel) =>
        deploymentModel(
          _.node('a'),
          _.node('a.b1').with(
            _.instanceOf('cloud.db'),
          ),
          _.node('a.b2'),
          _.node('a.b2.c').with(
            _.instanceOf('cloud.ui'),
            _.instanceOf('cloud.backend.api'),
          ),
        )
      ))

      it('should include realtion when porperties match', () => {
        t.expect(t.computeView(
          $include('a.b2.c -> a.b1', { where: 'tag is #old' }),
        )).toHave({
          nodes: [
            'a.b2',
            'a.b2.c',
            'a.b1',
          ],
          edges: [
            'a.b2.c -> a.b1',
          ],
        })
      })

      it('should not include realtion when properties do not match', () => {
        t.expect(t.computeView(
          $include('a.b2.c -> a.b1', { where: 'tag is not #old' }),
        )).toHave({
          nodes: [],
          edges: [],
        })
      })
    })

    describe('node -> instance where', () => {
      it('should include realtion when porperties match', () => {
        t.expect(t.computeView(
          $include('a.b2.c -> a.b2.db', { where: 'tag is #old' }),
        )).toHave({
          nodes: [
            'a.b2.c',
            'a.b2.db',
          ],
          edges: [
            'a.b2.c -> a.b2.db',
          ],
        })
      })

      it('should not include realtion when properties do not match', () => {
        t.expect(t.computeView(
          $include('a.b2.c -> a.b2.db', { where: 'tag is not #old' }),
        )).toHave({
          nodes: [],
          edges: [],
        })
      })
    })
  })

  describe('instance -> *', () => {
    const t = TestHelper.from(builder.deployment((_, deploymentModel) =>
      deploymentModel(
        _.node('a'),
        _.node('a.b1'),
        _.node('a.b1.c').with(
          _.instanceOf('cloud.ui'),
          _.instanceOf('cloud.backend.api'),
        ),
        _.node('a.b2').with(
          _.instanceOf('cloud.db'),
        ),
        _.node('a.b2.c').with(
          _.instanceOf('cloud.ui'),
          _.instanceOf('cloud.backend.api'),
        ),
      )
    ))

    describe('instance -> * where', () => {
      it('should include realtion when porperties match', () => {
        t.expect(t.computeView(
          $include('a.b2.c.api -> *', { where: 'tag is #old' }),
        )).toHave({
          nodes: [
            'a.b2.c',
            'a.b2.c.api',
            'a.b2.db',
          ],
          edges: [
            'a.b2.c.api -> a.b2.db',
          ],
        })
      })

      it('should not include realtion when properties do not match', () => {
        t.expect(t.computeView(
          $include('a.b2.c.api -> *', { where: 'tag is not #old' }),
        )).toHave({
          nodes: [],
          edges: [],
        })
      })
    })

    describe('instance -> node where', () => {
      const t = TestHelper.from(builder.deployment((_, deploymentModel) =>
        deploymentModel(
          _.node('a'),
          _.node('a.b1'),
          _.node('a.b1.c').with(
            _.instanceOf('cloud.ui'),
            _.instanceOf('cloud.backend.api'),
          ),
          _.node('a.b2'),
          _.node('a.b2.d').with(
            _.instanceOf('cloud.db'),
          ),
          _.node('a.b2.c').with(
            _.instanceOf('cloud.ui'),
            _.instanceOf('cloud.backend.api'),
          ),
        )
      ))

      it('should include realtion when porperties match', () => {
        t.expect(t.computeView(
          $include('a.b2.c.api -> a.b2.d', { where: 'tag is #old' }),
        )).toHave({
          nodes: [
            'a.b2.c',
            'a.b2.c.api',
            'a.b2.d',
          ],
          edges: [
            'a.b2.c.api -> a.b2.d',
          ],
        })
      })

      it('should not include realtion when properties do not match', () => {
        t.expect(t.computeView(
          $include('a.b2.c.api -> a.b2.d', { where: 'tag is not #old' }),
        )).toHave({
          nodes: [],
          edges: [],
        })
      })
    })

    describe('instance -> instance where', () => {
      it('should include realtion when porperties match', () => {
        t.expect(t.computeView(
          $include('a.b2.c.ui -> a.b2.c.api', { where: 'tag is #next' }),
        )).toHave({
          nodes: [
            'a.b2.c.ui',
            'a.b2.c.api',
          ],
          edges: [
            'a.b2.c.ui -> a.b2.c.api',
          ],
        })
      })

      it('should not include realtion when properties do not match', () => {
        t.expect(t.computeView(
          $include('a.b2.c.ui -> a.b2.c.api', { where: 'tag is not #next' }),
        )).toHave({
          nodes: [],
          edges: [],
        })
      })
    })
  })
})
