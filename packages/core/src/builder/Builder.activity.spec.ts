import { describe, expect, it } from 'vitest'
import { Builder } from './Builder'

describe('Builder (activity)', () => {
  const spec = Builder
    .specification({
      elements: {
        system: {},
        actor: {},
        component: {},
      },
    })

  it('should build ', () => {
    const b = spec.clone()
      .model(({ actor, system, component, activity }, _) =>
        _(
          actor('customer').with(
            activity('A'),
          ),
          system('cloud').with(
            component('ui').with(
              activity('B'),
            ),
          ),
        )
      )

    expect(b.build()).toMatchSnapshot()
  })

  it('should build steps 1', () => {
    const b = spec.clone()
      .model(({ actor, system, component, activity, step }, _) =>
        _(
          actor('customer').with(
            // activity('A'),
          ),
          system('cloud').with(
            component('api').with(
              activity('B', [
                '-> customer',
              ]),
            ),
            component('ui').with(
              activity('C', [
                step('-> cloud.api#B'),
                step('<- cloud.api#B'),
              ]),
            ),
          ),
        )
      )
    expect(b.build()).toMatchSnapshot()
  })

  it('should fail same hierarchy', () => {
    expect(() => {
      const b = spec.clone()
        .model(({ system, component, activity, step }, _) =>
          _(
            system('cloud').with(
              component('api').with(
                activity('B', {
                  steps: [
                    step('<- cloud.api'),
                  ],
                }),
              ),
            ),
          )
        )
    }).toThrowError('Invalid activity step between elements in the same hierarchy')
  })

  it('should build steps 2', () => {
    const b = spec.clone()
      .model(({ actor, system, component, activity, step }, _) =>
        _(
          actor('customer'),
          system('cloud').with(
            component('api'),
          ),
          activity('cloud.api#B'),
          component('cloud.ui').with(
            activity('C', [
              step('-> cloud.api#B'),
              step('<- cloud.api#B'),
            ]),
          ),
        )
      )
    expect(b.build()).toMatchSnapshot()
  })

  // it('should fail if invalid ID provided ', () => {
  //   expect(() => {
  //     spec.model(({ actor }, _) =>
  //       _(
  //         actor('cust.omer'),
  //       )
  //     )
  //   }).toThrowError('Parent element with id "cust" not found for element with id "cust.omer"')
  // })

  // it('should fail on invalid instance ', () => {
  //   const b = spec.clone()
  //     .model(_ =>
  //       _.model(
  //         _.component('cloud'),
  //         _.component('cloud.ui'),
  //       )
  //     )

  //   expect(() => {
  //     const raw = b.deployment(_ =>
  //       _.deployment(
  //         _.instanceOf('cloud.ui'),
  //       )
  //     ).build()
  //   }).toThrowError('Instance ui of cloud.ui must be deployed under a parent node')

  //   // Nested instanceOf is correct

  //   const raw = b.deployment(_ =>
  //     _.deployment(
  //       _.node('node').with(
  //         _.instanceOf('cloud.ui'),
  //       ),
  //     )
  //   ).build()
  //   expect(raw.deployments.elements).toEqual({
  //     node: expect.objectContaining({ id: 'node' }),
  //     // Take name from element
  //     'node.ui': expect.objectContaining({ id: 'node.ui', element: 'cloud.ui' }),
  //   })
  // })
})
