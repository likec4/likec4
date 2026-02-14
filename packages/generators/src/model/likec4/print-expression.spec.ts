import type { Expression, ModelExpression, WhereOperator } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import {
  printExpression,
  printFqnExprAny,
  printModelExpression,
  printModelFqnExpr,
  printWhereOperator as where,
} from './print-expression'

// ---- where ----

describe('where', () => {
  it('prints tag equality', () => {
    expect(where({ tag: 'internal' })).toBe('tag is #internal')
  })

  it('prints tag inequality (neq)', () => {
    expect(where({ tag: { neq: 'external' } })).toBe('tag is not #external')
  })

  it('prints tag equality (eq)', () => {
    expect(where({ tag: { eq: 'internal' } })).toBe('tag is #internal')
  })

  it('prints kind equality', () => {
    expect(where({ kind: 'component' })).toBe('kind is component')
  })

  it('prints kind inequality', () => {
    expect(where({ kind: { neq: 'system' } })).toBe('kind is not system')
  })

  it('prints not operator', () => {
    const op = { not: { tag: 'internal' } } as WhereOperator
    expect(where(op)).toBe('not (tag is #internal)')
  })

  it('prints and operator', () => {
    const op = {
      and: [
        { tag: 'internal' },
        { kind: 'component' },
      ],
    } as WhereOperator
    expect(where(op)).toBe('tag is #internal and kind is component')
  })

  it('prints or operator', () => {
    const op = {
      or: [
        { tag: 'internal' },
        { kind: 'component' },
      ],
    } as WhereOperator
    expect(where(op)).toBe('tag is #internal or kind is component')
  })

  it('wraps or children in parentheses inside and', () => {
    const op = {
      and: [
        { or: [{ tag: 'a' }, { tag: 'b' }] },
        { kind: 'component' },
      ],
    } as WhereOperator
    expect(where(op)).toBe('(tag is #a or tag is #b) and kind is component')
  })

  it('wraps and children in parentheses inside or', () => {
    const op = {
      or: [
        { and: [{ tag: 'a' }, { tag: 'b' }] },
        { kind: 'component' },
      ],
    } as WhereOperator
    expect(where(op)).toBe('(tag is #a and tag is #b) or kind is component')
  })

  it('prints participant operator', () => {
    const op = { participant: 'source', operator: { tag: 'internal' } } as WhereOperator
    expect(where(op)).toBe('source.tag is #internal')
  })
})

// ---- printModelExpression ----

describe('printModelExpression', () => {
  it('prints wildcard', () => {
    const expr = { wildcard: true } as unknown as ModelExpression
    expect(printModelExpression(expr)).toBe('*')
  })

  it('prints model ref', () => {
    const expr = { ref: { model: 'cloud.backend' } } as unknown as ModelExpression
    expect(printModelExpression(expr)).toBe('cloud.backend')
  })

  it('prints model ref with selector', () => {
    const expr = { ref: { model: 'cloud' }, selector: 'descendants' } as unknown as ModelExpression
    expect(printModelExpression(expr)).toBe('cloud.**')
  })

  it('prints element kind expression (equal)', () => {
    const expr = { elementKind: 'component', isEqual: true } as unknown as ModelExpression
    expect(printModelExpression(expr)).toBe('element.kind == component')
  })

  it('prints element kind expression (not equal)', () => {
    const expr = { elementKind: 'system', isEqual: false } as unknown as ModelExpression
    expect(printModelExpression(expr)).toBe('element.kind != system')
  })

  it('prints element tag expression', () => {
    const expr = { elementTag: 'internal', isEqual: true } as unknown as ModelExpression
    expect(printModelExpression(expr)).toBe('element.tag == #internal')
  })

  it('prints direct relation', () => {
    const expr = {
      source: { ref: { model: 'a' } },
      target: { ref: { model: 'b' } },
      isBidirectional: false,
    } as unknown as ModelExpression
    expect(printModelExpression(expr)).toBe('a -> b')
  })

  it('prints bidirectional relation', () => {
    const expr = {
      source: { ref: { model: 'a' } },
      target: { ref: { model: 'b' } },
      isBidirectional: true,
    } as unknown as ModelExpression
    expect(printModelExpression(expr)).toBe('a <-> b')
  })

  it('prints incoming relation', () => {
    const expr = { incoming: { ref: { model: 'cloud' } } } as unknown as ModelExpression
    expect(printModelExpression(expr)).toBe('-> cloud')
  })

  it('prints outgoing relation', () => {
    const expr = { outgoing: { ref: { model: 'cloud' } } } as unknown as ModelExpression
    expect(printModelExpression(expr)).toBe('cloud ->')
  })

  it('prints inout relation', () => {
    const expr = { inout: { ref: { model: 'cloud' } } } as unknown as ModelExpression
    expect(printModelExpression(expr)).toBe('-> cloud ->')
  })

  it('prints fqn where expression', () => {
    const expr = {
      where: {
        expr: { ref: { model: 'cloud' }, selector: 'descendants' },
        condition: { tag: 'internal' },
      },
    } as unknown as ModelExpression
    expect(printModelExpression(expr)).toBe('cloud.** where tag is #internal')
  })

  it('prints custom fqn with properties', () => {
    const expr = {
      custom: {
        expr: { ref: { model: 'cloud' } },
        title: 'My Cloud',
        color: 'blue',
      },
    } as unknown as ModelExpression
    const result = printModelExpression(expr)
    expect(result).toContain('cloud with {')
    expect(result).toContain('title \'My Cloud\'')
    expect(result).toContain('color blue')
  })

  it('prints custom relation with properties', () => {
    const expr = {
      customRelation: {
        expr: {
          source: { ref: { model: 'a' } },
          target: { ref: { model: 'b' } },
          isBidirectional: false,
        },
        title: 'calls',
        color: 'red',
        line: 'dotted',
      },
    } as unknown as ModelExpression
    expect(printModelExpression(expr)).toMatchInlineSnapshot(`
      "a -> b with {
        title 'calls'
        color red
        line dotted
      }"
    `)
  })
})

// ---- printModelFqnExpr ----

describe('printModelFqnExpr', () => {
  it('prints wildcard', () => {
    const expr = { wildcard: true } as any
    expect(printModelFqnExpr(expr)).toBe('*')
  })

  it('prints model ref with children selector', () => {
    const expr = { ref: { model: 'cloud' }, selector: 'children' } as any
    expect(printModelFqnExpr(expr)).toBe('cloud.*')
  })

  it('prints custom element expression', () => {
    const expr = {
      custom: {
        expr: { ref: { model: 'cloud' } },
        shape: 'browser',
      },
    } as any
    const result = printModelFqnExpr(expr)
    expect(result).toContain('cloud with {')
    expect(result).toContain('shape browser')
  })
})

// ---- printExpression (deployment expressions) ----

describe('printExpression', () => {
  it('prints wildcard', () => {
    const expr = { wildcard: true } as unknown as Expression
    expect(printExpression(expr)).toBe('*')
  })

  it('prints deployment ref', () => {
    const expr = { ref: { deployment: 'prod.eu' } } as unknown as Expression
    expect(printExpression(expr)).toBe('prod.eu')
  })

  it('prints deployment ref with expanded selector', () => {
    const expr = { ref: { deployment: 'prod' }, selector: 'expanded' } as unknown as Expression
    expect(printExpression(expr)).toBe('prod._')
  })

  it('prints deployment direct relation', () => {
    const expr = {
      source: { ref: { deployment: 'prod.a' } },
      target: { ref: { deployment: 'prod.b' } },
      isBidirectional: false,
    } as unknown as Expression
    expect(printExpression(expr)).toBe('prod.a -> prod.b')
  })

  it('prints deployment where expression', () => {
    const expr = {
      where: {
        expr: { ref: { deployment: 'prod' }, selector: 'descendants' },
        condition: { kind: 'node' },
      },
    } as unknown as Expression
    expect(printExpression(expr)).toBe('prod.** where kind is node')
  })

  it('prints custom deployment element with properties', () => {
    const expr = {
      custom: {
        expr: { ref: { deployment: 'prod.api' } },
        title: 'API',
        navigateTo: 'api-view',
      },
    } as unknown as Expression
    const result = printExpression(expr)
    expect(result).toContain('prod.api with {')
    expect(result).toContain('title \'API\'')
    expect(result).toContain('navigateTo api-view')
  })

  it('prints custom deployment relation with properties', () => {
    const expr = {
      customRelation: {
        expr: {
          source: { ref: { deployment: 'a' } },
          target: { ref: { deployment: 'b' } },
          isBidirectional: false,
        },
        head: 'diamond',
        tail: 'crow',
      },
    } as unknown as Expression
    const result = printExpression(expr)
    expect(result).toContain('a -> b with {')
    expect(result).toContain('head diamond')
    expect(result).toContain('tail crow')
  })
})

// ---- printFqnExprAny ----

describe('printFqnExprAny', () => {
  it('prints wildcard', () => {
    const expr = { wildcard: true } as any
    expect(printFqnExprAny(expr)).toBe('*')
  })

  it('prints deployment ref', () => {
    const expr = { ref: { deployment: 'prod.eu.zone1' } } as any
    expect(printFqnExprAny(expr)).toBe('prod.eu.zone1')
  })

  it('prints model ref', () => {
    const expr = { ref: { model: 'cloud' } } as any
    expect(printFqnExprAny(expr)).toBe('cloud')
  })

  it('prints element kind expression', () => {
    const expr = { elementKind: 'system', isEqual: true } as any
    expect(printFqnExprAny(expr)).toBe('element.kind == system')
  })

  it('prints custom expression', () => {
    const expr = {
      custom: {
        expr: { ref: { deployment: 'prod' } },
        color: 'green',
      },
    } as any
    const result = printFqnExprAny(expr)
    expect(result).toContain('prod with {')
    expect(result).toContain('color green')
  })
})
