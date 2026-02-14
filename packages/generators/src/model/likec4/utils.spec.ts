import { Builder } from '@likec4/core/builder'
import { NL } from 'langium/generate'
import { reduce, values } from 'remeda'
import { type Assertion, describe, expect as viExpect, it, test } from 'vitest'
import {
  type Op,
  type PrintOp,
  body,
  each,
  element,
  inlineText,
  keyword,
  print,
  PrintCtx,
  select,
  text,
} from './utils'

describe('text', () => {
  function expect(...ops: Op<any>[]): Assertion<string> {
    const result = reduce(ops, (ctx, op) => op(ctx), PrintCtx())
    return viExpect(
      result.toString(),
    )
  }

  test('inline', () => {
    expect(inlineText('hello')).toBe('\'hello\'')
    expect(inlineText('hello\nworld')).toBe(`'hello world'`)
  })

  it('should print text with single quotes', () => {
    expect(text(`hello world`)).toBe(`'hello world'`)
  })

  it('should print text with single quotes and escaped quotes', () => {
    expect(text(`hello 'world'`)).toMatchInlineSnapshot(`"'hello \\'world\\''"`)
  })

  it('should print text with newline', () => {
    expect(
      text('hello\nworld'),
    ).toMatchInlineSnapshot(`
      "''
        hello
        world
      ''"
    `)
  })

  it('should print text with newline and escape quotes', () => {
    expect(
      keyword('title'),
      text('hello\n\'this\'\nworld'),
    ).toMatchInlineSnapshot(`
      "title''
        hello
        \\'this\\'
        world
      ''"
    `)
  })
})

const model = Builder
  .specification({
    elements: {
      actor: {},
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
    metadataKeys: ['key1', 'key2'],
  })
  .model(({ actor, system, component, relTo }, _) =>
    _(
      actor('alice'),
      actor('bob', {
        title: 'Bob',
        tags: ['tag1', 'tag2' as const],
      }),
      system('cloud').with(
        component('backend').with(
          component('api', {
            title: 'API Services',
          }),
          component('db'),
        ),
        component('frontend'),
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
      ),
    )
  )
  // Test Element View
  .views(({ view, $include }, _) =>
    _(
      // rules inside
      view('view1', $include('cloud.backend')),
      view('view2', $include('cloud.backend')),
    )
  )
  .build()

describe('context', () => {
  function expect(...ops: PrintOp<typeof model>[]): Assertion<string> {
    const result = reduce(ops, (ctx, op) => op(ctx), PrintCtx({ value: model }))
    return viExpect(
      result.toString(),
    )
  }

  it('inherits out from parent', () => {
    expect(
      print('model '),
      body(
        select(
          c => values(c.elements),
          each({
            separator: NL,
            suffix(element, index, isLast) {
              if (!isLast) {
                return NL
              }
            },
            print: element(),
          }),
        ),
      ),
    ).toMatchInlineSnapshot(`
      "model {
        alice = actor 'alice' {}

        bob = actor 'Bob' {
          #tag1, #tag2
        }

        cloud = system 'cloud' {}

        backend = component 'backend' {}

        api = component 'API Services' {}

        db = component 'db' {}

        frontend = component 'frontend' {}
      }"
    `)
  })
})
