import { isString } from 'remeda'
import { type Assertion, describe, expect as viExpect, it } from 'vitest'
import z from 'zod/v4'
import {
  type Op,
  type Ops,
  body,
  eachOnFresh,
  eq,
  executeOnCtx,
  executeOnFresh,
  foreach,
  fresh,
  guard,
  indent,
  inlineText,
  lines,
  markdown,
  markdownOrString,
  materialize,
  merge,
  newline,
  print,
  printProperty,
  property,
  select,
  separateNewLine,
  separateWith,
  space,
  spaceBetween,
  text,
  withctx,
} from './base'

/**
 * Returns expect function to execute operations on the given context
 */
function expectOnCtx<A>(ctx: A) {
  const exec = withctx(ctx)
  return (...ops: Ops<A>): Assertion<string> => viExpect(materialize(exec(...ops)))
}

function expectOp(...op: Op<any>[]): Assertion<string> {
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
      "'
        hello
        world
      '"
    `)
  })

  it('should print multiline text with newline and escaped quotes', () => {
    expectOp(
      text('hello\n\'this\'\nworld'),
    ).toMatchInlineSnapshot(`
      "'
        hello
        \\'this\\'
        world
      '"
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
    "id = element 'oneline' multiline '
      hello
      world
    '"
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

describe('property', () => {
  const expect = expectOnCtx({
    name: 'John',
    home: {
      city: 'New York',
    },
    one: {
      two: {
        three: 'deep',
      },
    },
  })

  it('should print property name and value', () => {
    expect(property('name')).toEqual(`name John`)
  })

  it('should print property value', () => {
    expect(printProperty('name')).toEqual(`John`)
  })

  it('should fail when property non printable', () => {
    viExpect(() => {
      materialize(
        withctx({
          nonPrintable: {},
        })(
          property('nonPrintable'),
        ),
      )
    }).toThrowErrorMatchingInlineSnapshot(`[Error: Property nonPrintable is not printable "[object Object]"]`)
  })

  it('should select property from context and print using given operator', () => {
    expect(
      spaceBetween(
        print('name'),
        eq(),
        property('name', text()),
      ),
    ).toEqual(`name = 'John'`)
  })

  it('should select deep property from context', () => {
    expect(
      spaceBetween(
        print('deep'),
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
    ).toEqual(`deep = 'deep'`)
  })
})

describe('context', () => {
  it('should execute operations on the context', () => {
    expectOnCtx('world')(
      spaceBetween(
        print('hello'),
        print(),
      ),
    ).toEqual(`hello world`)
  })

  it('should execute forEach', () => {
    expectOnCtx(
      {
        items: [
          { name: 'one' },
          { name: 'two' },
          { name: 'three' },
        ],
      } as const,
    )(
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
    expectOnCtx({
      one: {
        two: {
          three: 'world',
        },
      },
    })(
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
    expectOnCtx('string' as string | Date)(
      guard(
        isString,
        spaceBetween(
          print('context'),
          eq(),
          text(),
        ),
      ),
    ).toEqual(`context = 'string'`)
  })

  it('should guard context with zod schema', () => {
    expectOnCtx(0 as string | number)(
      guard(
        z.number(),
        spaceBetween(
          print('context is'),
          print(v => typeof v),
        ),
      ),
    ).toEqual(`context is number`)

    viExpect(() => {
      materialize(
        withctx(
          0 as Map<string, string> | number,
          // @ts-expect-error - guard should fail
          guard(
            z.string(),
            print(),
          ),
        ),
      )
    }).toThrowErrorMatchingInlineSnapshot(`[Error: Guard failed: ✖ Invalid input: expected string, received number]`)
  })
})

describe('fresh', () => {
  it('should create a context with the given value and empty output', () => {
    const ctx = fresh('hello')
    viExpect(ctx.ctx).toBe('hello')
    viExpect(ctx.out.isEmpty()).toBe(true)
  })

  it('should create a context with an object', () => {
    const ctx = fresh({ name: 'world' })
    viExpect(ctx.ctx).toEqual({ name: 'world' })
    viExpect(ctx.out.isEmpty()).toBe(true)
  })
})

describe('materialize', () => {
  it('should materialize context to string', () => {
    const ctx = fresh('hello')
    ctx.out.append('hello world')
    viExpect(materialize(ctx)).toBe('hello world')
  })

  it('should materialize an operation on a fresh context', () => {
    const result = materialize(print('hello'))
    viExpect(result).toBe('hello')
  })

  it('should use custom indentation if number is provided', () => {
    const result = materialize(
      merge(
        print('root {'),
        indent(print('child')),
        print('}'),
      ),
      4,
    )
    viExpect(result).toMatchInlineSnapshot(`
      "root {
          child
      }"
    `)
  })

  it('should use custom indentation if string is provided', () => {
    const result = materialize(
      merge(
        print('root {'),
        indent(print('child')),
        print('}'),
      ),
      '|___',
    )
    viExpect(result).toMatchInlineSnapshot(`
      "root {
      |___child
      }"
    `)
  })
})

describe('executeOnCtx', () => {
  it('should execute operations sequentially on the same context', () => {
    const ctx = fresh(undefined)
    const result = executeOnCtx(ctx, [
      print('hello'),
      print(' '),
      print('world'),
    ])
    viExpect(materialize(result)).toBe('hello world')
  })

  it('should pass through context value', () => {
    const result = executeOnCtx(fresh('test'), [
      print(),
    ])
    viExpect(materialize(result)).toBe('test')
  })
})

describe('executeOnFresh', () => {
  it('should execute operations on a new output node', () => {
    const result = executeOnFresh('ctx-value', [
      print('output'),
    ])
    viExpect(result.ctx).toBe('ctx-value')
    viExpect(materialize(result)).toBe('output')
  })
})

describe('eachOnFresh', () => {
  it('should execute each operation on its own fresh context', () => {
    const results = eachOnFresh('hello', [
      print('one'),
      print('two'),
      print('three'),
    ])
    viExpect(results).toHaveLength(3)
    viExpect(materialize(results[0]!)).toBe('one')
    viExpect(materialize(results[1]!)).toBe('two')
    viExpect(materialize(results[2]!)).toBe('three')
  })
})

describe('print', () => {
  it('should print context value when no argument is given', () => {
    expectOnCtx('hello')(print()).toBe('hello')
  })

  it('should print a number context', () => {
    expectOnCtx(42)(print()).toBe('42')
  })

  it('should print a boolean context', () => {
    expectOnCtx(true)(print()).toBe('true')
  })

  it('should print using a format function', () => {
    expectOnCtx('world')(
      print(v => `hello ${v}`),
    ).toBe('hello world')
  })

  it('should skip nullish values', () => {
    expectOnCtx(null as any)(print()).toBe('')
    expectOnCtx(undefined as any)(print()).toBe('')
  })

  it('should throw on non-primitive values', () => {
    viExpect(() =>
      materialize(
        // @ts-ignore
        withctx({ obj: true }, print()),
      )
    ).toThrow('Value must be a string, number or boolean')
  })
})

describe('newline', () => {
  it('should append a newline', () => {
    expectOp(
      merge(print('a'), newline(), print('b')),
    ).toMatchInlineSnapshot(`
      "a
      b"
    `)
  })

  it('should append newline only if not empty with ifNotEmpty', () => {
    expectOp(
      merge(newline('ifNotEmpty'), print('hello')),
    ).toBe('hello')
  })

  it('should append newline when content exists with ifNotEmpty', () => {
    expectOp(
      merge(print('a'), newline('ifNotEmpty'), print('b')),
    ).toMatchInlineSnapshot(`
      "a
      b"
    `)
  })
})

describe('merge', () => {
  it('should merge multiple operations into single output', () => {
    expectOp(
      merge(print('hello'), print(' '), print('world')),
    ).toBe('hello world')
  })

  it('should skip empty output from operations', () => {
    expectOp(
      merge(print('hello'), merge(), print(' world')),
    ).toBe('hello world')
  })
})

describe('indent', () => {
  it('should indent a string', () => {
    expectOp(
      merge(
        print('parent {'),
        indent('child'),
        print('}'),
      ),
    ).toMatchInlineSnapshot(`
      "parent {
        child
      }"
    `)
  })

  it('should indent multiline string', () => {
    expectOp(
      merge(
        print('parent {'),
        indent('line1\nline2\nline3'),
        print('}'),
      ),
    ).toMatchInlineSnapshot(`
      "parent {
        line1
        line2
        line3
      }"
    `)
  })

  it('should skip empty string', () => {
    expectOp(
      merge(
        print('parent'),
        indent('  '),
      ),
    ).toBe('parent')
  })

  it('should indent operations', () => {
    expectOp(
      merge(
        print('parent {'),
        indent(
          print('child1'),
          newline(),
          print('child2'),
        ),
        print('}'),
      ),
    ).toMatchInlineSnapshot(`
      "parent {
        child1
        child2
      }"
    `)
  })

  it('should skip indent when operations produce no content', () => {
    expectOp(
      merge(
        print('parent'),
        indent(
          merge(),
          merge(),
        ),
      ),
    ).toBe('parent')
  })
})

describe('body', () => {
  it('should wrap operations in braces', () => {
    expectOp(
      body(
        print('child'),
      ),
    ).toMatchInlineSnapshot(`
      "{
        child
      }"
    `)
  })

  it('should ignore empty operations', () => {
    expectOp(
      body(
        spaceBetween(
          print(),
          print(),
        ),
      ),
    ).toBe('')
  })

  it('should wrap with keyword prefix', () => {
    expectOp(
      body('element')(
        print('name = test'),
      ),
    ).toMatchInlineSnapshot(`
      "element {
        name = test
      }"
    `)
  })

  it('should wrap multiple lines in body', () => {
    expectOp(
      body('model')(
        print('line1'),
        print('line2'),
      ),
    ).toMatchInlineSnapshot(`
      "model {
        line1
        line2
      }"
    `)
  })
})

describe('inlineText', () => {
  it('should use context value when no argument given', () => {
    expectOnCtx('hello')(inlineText()).toBe('\'hello\'')
  })

  it('should collapse tabs and newlines into spaces', () => {
    expectOp(inlineText('hello\t\nworld')).toBe('\'hello world\'')
  })

  it('should skip nullish context', () => {
    expectOnCtx(null as any)(inlineText()).toBe('')
  })

  it('should fail non-string context', () => {
    viExpect(() =>
      materialize(
        withctx(42 as any)(
          inlineText(),
        ),
      )
    ).toThrowErrorMatchingInlineSnapshot(`[Error: Value must be a string - got number]`)
  })
})

describe('text', () => {
  it('should use context value when no argument given', () => {
    expectOnCtx('hello')(text()).toBe('\'hello\'')
  })

  it('should accept a format function', () => {
    expectOnCtx('world')(
      text(v => `hello ${v}`),
    ).toBe('\'hello world\'')
  })

  it('should skip nullish values', () => {
    expectOnCtx(null as any)(text()).toBe('')
  })

  it('should fail non-string context', () => {
    viExpect(() =>
      materialize(
        withctx(42 as any)(
          text(),
        ),
      )
    ).toThrowErrorMatchingInlineSnapshot(`[Error: Value must be a string - got number]`)
  })
})

describe('markdown', () => {
  it('should use context value when no argument given', () => {
    expectOnCtx('hello')(markdown()).toMatchInlineSnapshot(`
      "'''
        hello
      '''"
    `)
  })

  it('should skip nullish context', () => {
    expectOnCtx(null as any)(markdown()).toBe('')
  })
})

describe('markdownOrString', () => {
  it('should print markdown variant', () => {
    expectOp(
      markdownOrString({ md: '# Title\n\nBody' }),
    ).toMatchInlineSnapshot(`
      "'''
        # Title
        
        Body
      '''"
    `)
  })

  it('should print txt variant', () => {
    expectOp(
      markdownOrString({ txt: 'hello\nworld' }),
    ).toMatchInlineSnapshot(`
      "'
        hello
        world
      '"
    `)
  })

  it('should use context value when no argument given', () => {
    expectOnCtx({ md: 'hello' } as { md: string })(
      markdownOrString(),
    ).toMatchInlineSnapshot(`
      "'''
        hello
      '''"
    `)
  })

  it('should skip nullish value', () => {
    expectOnCtx(null as any)(markdownOrString()).toBe('')
  })
})

describe('separateWith', () => {
  it('should return join options with separator', () => {
    const expect = expectOnCtx(
      {
        items: ['a', 'b', 'c'],
      } as const,
    )
    expect(
      property(
        'items',
        foreach(
          print(),
          separateWith(', '),
        ),
      ),
    ).toBe('a, b, c')
  })
})

describe('separateNewLine', () => {
  it('should return join options with newline separator', () => {
    const expect = expectOnCtx(
      {
        items: ['a', 'b', 'c'],
      } as const,
    )
    expect(
      property(
        'items',
        foreach(
          print(),
          separateNewLine(),
        ),
      ),
    ).toMatchInlineSnapshot(`
      "a
      b
      c"
    `)
  })
})

describe('foreach', () => {
  it('should execute single op on each item', () => {
    expectOnCtx(['a', 'b', 'c'] as const)(
      foreach(print()),
    ).toBe('abc')
  })

  it('should execute multiple ops on each item', () => {
    expectOnCtx(['a', 'b', 'c'] as const)(
      foreach(
        print(),
        print('-'),
      ),
    ).toBe('a-b-c-')
  })

  it('should filter empty items with join options', () => {
    const items = [
      { name: 'one' },
      { name: null as string | null },
      { name: 'three' },
    ]
    expectOnCtx(items)(
      foreach(
        property('name', print()),
        separateWith(', '),
      ),
    ).toBe('one, three')
  })
})

describe('guard', () => {
  it('should skip when condition is false', () => {
    expectOnCtx(42 as string | number)(
      guard(isString, text()),
    ).toBe('')
  })
})

describe('select', () => {
  it('should skip when selector returns null', () => {
    expectOnCtx({ a: null as string | null })(
      select(c => c.a, text()),
    ).toBe('')
  })
})

describe('withctx', () => {
  it('should forward context when curried', () => {
    expectOp(
      withctx('hello')(
        print(),
        space(),
        print('world'),
      ),
    ).toBe('hello world')
  })

  it('should forward context with composite', () => {
    expectOp(
      withctx(
        'world',
        print('hello'),
        space(),
        print(),
      ),
    ).toBe('hello world')
  })
})
