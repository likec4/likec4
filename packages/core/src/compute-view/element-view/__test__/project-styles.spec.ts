import { describe, expect, it } from 'vitest'
import { Builder } from '../../../builder'

describe('Project styles', () => {
  const builder = Builder
    .specification({
      elements: {
        el: {},
        queue: {
          style: {
            color: 'green',
            shape: 'queue',
          },
        },
        full: {
          style: {
            border: 'none',
            opacity: 0.2,
            size: 'xs',
            padding: 'xs',
          },
        },
      },
    })
    .model((_, m) =>
      m(
        _.el('el'),
        _.queue('queue'),
        _.full('full'),
      )
    )
    .views((_, v) =>
      v(
        _.view('index', _.$include('*')),
      )
    )

  it('inherit styles', () => {
    const m = builder.toLikeC4Model({
      id: 'test',
      styles: {
        defaults: {
          element: {
            shape: 'browser',
            color: 'red',
            size: 'lg',
          },
        },
      },
    })

    expect(m.element('el').shape).toBe('browser')
    expect(m.element('el').color).toBe('red')
    expect(m.element('el').style).toMatchInlineSnapshot(
      {
        border: 'solid',
        opacity: 100,
        size: 'lg',
      },
      `
      {
        "border": "solid",
        "opacity": 100,
        "size": "lg",
      }
    `,
    )

    expect(m.element('queue').shape).toBe('queue')
    expect(m.element('queue').color).toBe('green')
    expect(m.element('queue').style).toMatchInlineSnapshot(
      {
        border: 'solid',
        opacity: 100,
        size: 'lg',
      },
      `
      {
        "border": "solid",
        "opacity": 100,
        "size": "lg",
      }
    `,
    )

    expect(m.element('full').shape).toBe('browser')
    expect(m.element('full').color).toBe('red')
    expect(m.element('full').style).toMatchInlineSnapshot(
      {
        border: 'none',
        opacity: 0.2,
        padding: 'xs',
        size: 'xs',
      },
      `
      {
        "border": "none",
        "opacity": 0.2,
        "padding": "xs",
        "size": "xs",
      }
    `,
    )

    const view = m.view('index')

    const el = view.node('el')
    expect(el.shape).toBe('browser')
    expect(el.color).toBe('red')
    expect(el.style).toMatchInlineSnapshot(
      {
        border: 'solid',
        opacity: 100,
        size: 'lg',
      },
      `
      {
        "border": "solid",
        "opacity": 100,
        "size": "lg",
      }
    `,
    )

    const queue = view.node('queue')
    expect(queue.shape).toBe('queue')
    expect(queue.color).toBe('green')
    expect(queue.style).toMatchInlineSnapshot(
      {
        border: 'solid',
        opacity: 100,
        size: 'lg',
      },
      `
      {
        "border": "solid",
        "opacity": 100,
        "size": "lg",
      }
    `,
    )

    const full = view.node('full')
    expect(full.shape).toBe('browser')
    expect(full.color).toBe('red')
    expect(full.style).toMatchInlineSnapshot(
      {
        border: 'none',
        opacity: 0.2,
        padding: 'xs',
        size: 'xs',
      },
      `
      {
        "border": "none",
        "opacity": 0.2,
        "padding": "xs",
        "size": "xs",
      }
    `,
    )
  })
})
