import { type Assertion, describe, expect as viExpect, it } from 'vitest'
import {
  type Ops,
  materialize,
  withctx,
} from './base'
import { linksProperty, metadataProperty } from './properties'

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

describe('properties', () => {
  it('metadata', () => {
    const expect = expectOnCtx({
      metadata: {
        key1: 'value1',
        key2: 'multiline 1\nmultiline 2',
        key3: 'value2',
      },
    })
    expect(
      metadataProperty(),
    ).toMatchInlineSnapshot(`
      "metadata {
        key1 'value1'
        key2 ''
          multiline 1
          multiline 2
        ''
        key3 'value2'
      }"
    `)
  })

  it('links', () => {
    const expect = expectOnCtx({
      links: [
        { url: 'https://example1.com', title: 'Example1' },
        { url: 'https://example2.com' },
        { url: '../example3.md#123' },
      ],
    })
    expect(
      linksProperty(),
    ).toMatchInlineSnapshot(`
      "link https://example1.com 'Example1'
      link https://example2.com
      link ../example3.md#123"
    `)
  })
})
