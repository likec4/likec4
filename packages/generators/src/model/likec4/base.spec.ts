import { Builder } from '@likec4/core/builder'
import { isString } from 'remeda'
import { type Assertion, describe, expect as viExpect, it } from 'vitest'
import {
  type AnyOp,
  type Ops,
  eq,
  foreach,
  guard,
  inlineText,
  lines,
  markdown,
  materialize,
  merge,
  print,
  property,
  select,
  separateNewLine,
  spaceBetween,
  text,
  withctx,
} from './base'

/**
 * Returns expect function to execute operations on the given context
 */
function expectOnCtx<A>(ctx: A) {
  const exec = withctx(ctx)
  return (...ops: Ops<A>): Assertion<string> =>
    viExpect(
      materialize(exec(...ops)),
    )
}

function expectOp(...op: AnyOp[]): Assertion<string> {
  return expectOnCtx(undefined)(...op)
}

describe('text', () => {
  it('inlineText', () => {
    expectOp(inlineText('hello')).toBe('\'hello\'')
    expectOp(inlineText('hello\nworld')).toBe(`'hello world'`)
  })

  it('should print text with single quotes', () => {
    expectOp(text(`hello world`)).toBe(`'hello world'`)
  })

  it('should print text with single quotes and escaped quotes', () => {
    expectOp(text(`hello 'world'`)).toMatchInlineSnapshot(`"'hello \\'world\\''"`)
  })

  it('should print text with single quotes', () => {
    expectOp(text(`hello world`)).toBe(`'hello world'`)
  })

  it('should print multiline text with newline', () => {
    expectOp(
      text('hello\nworld'),
    ).toMatchInlineSnapshot(`
      "''
        hello
        world
      ''"
    `)
  })

  it('should print multiline text with newline and escaped quotes', () => {
    expectOp(
      text('hello\n\'this\'\nworld'),
    ).toMatchInlineSnapshot(`
      "''
        hello
        \\'this\\'
        world
      ''"
    `)
  })

  it('should print markdown', () => {
    expectOp(
      markdown('# Title\n\nThis is a **markdown** text'),
    ).toMatchInlineSnapshot(`
      "'''
        # Title

        This is a **markdown** text
      '''"
    `)
  })
})

describe('inline', () => {
  it('should separate with spaces', () => {
    expectOp(
      spaceBetween(
        print('id'),
        eq(),
        print('element'),
        text('oneline'),
        print('multiline'),
        text('hello\nworld'),
      ),
    ).toMatchInlineSnapshot(`
    "id = element 'oneline' multiline ''
      hello
      world
    ''"
  `)
  })
})

describe('lines', () => {
  const ops = [
    print('one'),
    print('two'),
    spaceBetween(
      print('three'),
      eq(),
      print('four'),
    ),
    print(), // must be skipped
    print('five'),
  ] as const satisfies Ops<string>

  it('should separate with newlines', () => {
    expectOp(
      lines(...ops),
    ).toMatchInlineSnapshot(`
      "one
      two
      three = four
      five"
    `)
  })

  it('should separate with given count of newlines', () => {
    expectOp(
      lines(1)(...ops),
    ).toMatchInlineSnapshot(`
      "one
      two
      three = four
      five"
    `)
  })

  it('should separate with given count of newlines', () => {
    expectOp(
      lines(2)(...ops),
    ).toMatchInlineSnapshot(`
      "one

      two

      three = four

      five"
    `)
  })
})

describe('context', () => {
  it('should execute operations on the context', () => {
    expectOnCtx('world')(
      spaceBetween(
        print('hello'),
        print(),
      ),
    ).toMatchInlineSnapshot(`"hello world"`)
  })

  it('should select property from context', () => {
    expectOp(
      withctx(
        {
          name: 'world',
        },
        spaceBetween(
          print('name'),
          eq(),
          property('name', text()),
        ),
      ),
    ).toMatchInlineSnapshot(`"name = 'world'"`)
  })

  it('should select deep property from context', () => {
    const expect = expectOnCtx({
      one: {
        two: {
          three: 'world',
        },
      },
    })
    expect(
      spaceBetween(
        print('name'),
        eq(),
        property(
          'one',
          property(
            'two',
            merge(
              property('three', text()),
              // @ts-expect-error property name does not exist
              property('thre2e', text()),
            ),
          ),
        ),
      ),
    ).toMatchInlineSnapshot(`"name = 'world'"`)
  })

  it('should execute forEach', () => {
    const expect = expectOnCtx(
      {
        items: [
          { name: 'one' },
          { name: 'two' },
          { name: 'three' },
        ],
      } as const,
    )
    expect(
      property(
        'items',
        foreach(
          spaceBetween(
            print('name'),
            eq(),
            property('name', text()),
          ),
          separateNewLine(),
        ),
      ),
    ).toMatchInlineSnapshot(`
      "name = 'one'
      name = 'two'
      name = 'three'"
    `)
  })

  it('should allow select from context', () => {
    const expect = expectOnCtx({
      one: {
        two: {
          three: 'world',
        },
      },
    })
    expect(
      spaceBetween(
        print('name'),
        eq(),
        select(
          c => c.one.two,
          property('three', markdown()),
          // @ts-expect-error property name does not exist
          property('threre', markdown()),
        ),
      ),
    ).toMatchInlineSnapshot(`
      "name = '''
        world
      '''"
    `)
  })

  it('should guard context', () => {
    const expect = expectOnCtx({
      one: {
        two: 'string' as string | Date,
      },
    })
    expect(
      select(
        c => c.one.two,
        guard(
          isString,
          spaceBetween(
            print('one.two'),
            eq(),
            text(),
          ),
        ),
      ),
    ).toMatchInlineSnapshot(`"one.two = 'string'"`)
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

// describe('context', () => {
//   function expect(...ops: PrintOp<typeof model>[]): Assertion<string> {
//     const result = reduce(ops, (ctx, op) => op(ctx), PrintCtx({ value: model }))
//     return viExpect(
//       result.toString(),
//     )
//   }

//   it('inherits out from parent', () => {
//     expect(
//       print('model '),
//       body(
//         select(
//           c => values(c.elements),
//           each({
//             separator: NL,
//             suffix(element, index, isLast) {
//               if (!isLast) {
//                 return NL
//               }
//             },
//             print: element(),
//           }),
//         ),
//       ),
//     ).toMatchInlineSnapshot(`
//       "model {
//         alice = actor 'alice' {}

//         bob = actor 'Bob' {
//           #tag1, #tag2
//         }

//         cloud = system 'cloud' {}

//         backend = component 'backend' {}

//         api = component 'API Services' {}

//         db = component 'db' {}

//         frontend = component 'frontend' {}
//       }"
//     `)
//   })
// })
