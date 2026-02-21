import type { Expression, FqnExpr, ModelExpression, ViewId, WhereOperator } from '@likec4/core'
import { dedent } from 'strip-indent'
import { type Assertion, describe, expect as viExpect, it } from 'vitest'
import type { ModelExpressionData, WhereOperatorData } from '../types'
import {
  type Ops,
  materialize,
  withctx,
} from './base'
import { expression, fqnExprAny, modelExpression, whereOperator } from './expressions'

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

/**
 * Returns expect function to execute operations on the given context
 */
function expectWhereOperator(operator: WhereOperator<any>) {
  const exec = withctx(operator as unknown as WhereOperatorData)
  return viExpect(
    materialize(exec(whereOperator())),
  )
}

describe('whereOperator', () => {
  it('should print tag equal', () => {
    expectWhereOperator({
      tag: 'tag1',
    }).toBe('tag is #tag1')

    expectWhereOperator({
      tag: {
        eq: 'tag2',
      },
    }).toBe('tag is #tag2')

    expectWhereOperator({
      tag: {
        neq: 'tag2',
      },
    }).toBe('tag is not #tag2')
  })

  it('should print kind equal', () => {
    expectWhereOperator({
      kind: 'system',
    }).toBe('kind is system')

    expectWhereOperator({
      kind: {
        eq: 'system',
      },
    }).toBe('kind is system')

    expectWhereOperator({
      kind: {
        neq: 'system',
      },
    }).toBe('kind is not system')
  })

  it('should print participant operator', () => {
    expectWhereOperator({
      participant: 'source',
      operator: { tag: 'tag1' },
    }).toBe('source.tag is #tag1')

    expectWhereOperator({
      participant: 'target',
      operator: { kind: { neq: 'system' } },
    }).toBe('target.kind is not system')
  })

  it('should print not operator', () => {
    expectWhereOperator({
      not: {
        tag: 'tag1',
      },
    }).toBe('not ( tag is #tag1 )')

    expectWhereOperator({
      not: {
        participant: 'target',
        operator: { kind: { neq: 'system' } },
      },
    }).toBe('not ( target.kind is not system )')
  })

  it('should print and operator', () => {
    expectWhereOperator({
      and: [
        { tag: 'tag1' },
        { kind: { neq: 'system' } },
      ],
    }).toBe(dedent(`
      tag is #tag1
      and kind is not system
    `))
  })

  it('should print or operator', () => {
    expectWhereOperator({
      or: [
        { tag: 'tag1' },
        { kind: { neq: 'system' } },
      ],
    }).toBe(dedent(`
      tag is #tag1
      or kind is not system
    `))
  })

  it('should wrap or operands in braces inside and', () => {
    expectWhereOperator({
      and: [
        {
          or: [
            { tag: 'tag1' },
            { kind: { neq: 'system' } },
          ],
        },
        {
          participant: 'source',
          operator: {
            tag: 'tag2',
          },
        },
      ],
    }).toBe(dedent(`
      (tag is #tag1
      or kind is not system)
      and source.tag is #tag2
    `))
  })

  it('should wrap and operands in braces inside or', () => {
    expectWhereOperator({
      or: [
        {
          and: [
            { tag: 'tag1' },
            { kind: { neq: 'system' } },
          ],
        },
        {
          participant: 'target',
          operator: {
            kind: 'system',
          },
        },
      ],
    }).toBe(dedent(`
      (tag is #tag1
      and kind is not system)
      or target.kind is system
    `))
  })
})

function expectModelExpr(expr: ModelExpression) {
  const exec = withctx(expr as unknown as ModelExpressionData)
  return viExpect(
    materialize(exec(modelExpression())).trimEnd(),
  )
}

describe('modelExpression', () => {
  const ref = {
    model: 'a.b',
  }
  const expr = {
    ref,
    selector: 'children' as const,
  }
  const condition = {
    and: [
      { tag: 'tag1' },
      { kind: { neq: 'system' } },
    ],
  } satisfies WhereOperator

  describe('fqnref', () => {
    it('should print fqnref', () => {
      expectModelExpr({
        wildcard: true,
      }).toBe('*')

      const ref = {
        model: 'a.b.c',
      }
      expectModelExpr({
        ref,
      }).toBe('a.b.c')

      expectModelExpr({
        ref,
        selector: 'children',
      }).toBe('a.b.c.*')

      expectModelExpr({
        ref,
        selector: 'descendants',
      }).toBe('a.b.c.**')

      expectModelExpr({
        ref,
        selector: 'expanded',
      }).toBe('a.b.c._')
    })

    it('should print fqnref where', () => {
      expectModelExpr({
        where: {
          expr,
          condition,
        },
      }).toBe(dedent(`
      a.b.*
        where
          tag is #tag1
          and kind is not system
    `))
    })

    it('should print fqnref with', () => {
      expectModelExpr({
        custom: {
          expr,
          shape: 'browser',
          title: 'override',
          navigateTo: 'other-view' as ViewId<string>,
          description: { md: '**markdown**' },
        },
      }).toBe(dedent(`
      a.b.* with {
        title 'override'
        description '''
          **markdown**
        '''
        navigateTo other-view
        shape browser
      }
    `))
    })

    it('should print fqnref where and with', () => {
      expectModelExpr({
        custom: {
          expr: {
            where: {
              expr,
              condition,
            },
          },
          shape: 'browser',
        },
      }).toBe(dedent(`
      a.b.*
        where
          tag is #tag1
          and kind is not system
        with {
          shape browser
        }
        `))
    })
  })

  describe('relation', () => {
    it('should print direct expression', () => {
      expectModelExpr({
        source: expr,
        target: { ref },
      }).toBe('a.b.* -> a.b')
    })

    it('should print bidirectional expression', () => {
      expectModelExpr({
        source: expr,
        target: { ref },
        isBidirectional: true,
      }).toBe('a.b.* <-> a.b')
    })

    it('should print incoming expression', () => {
      expectModelExpr({
        incoming: expr,
      }).toBe('-> a.b.*')
    })

    it('should print outgoing expression', () => {
      expectModelExpr({
        outgoing: expr,
      }).toBe('a.b.* ->')
    })

    it('should print in-out expression', () => {
      expectModelExpr({
        inout: expr,
      }).toBe('-> a.b.* ->')
    })

    it('should print expression where', () => {
      expectModelExpr({
        where: {
          expr: {
            source: expr,
            target: { ref },
            isBidirectional: true,
          },
          condition,
        },
      }).toBe(dedent(`
        a.b.* <-> a.b
          where
            tag is #tag1
            and kind is not system
      `))
    })

    it('should print expression with', () => {
      expectModelExpr({
        customRelation: {
          expr: {
            outgoing: { ref },
          },
          head: 'odiamond',
          tail: 'crow',
          line: 'solid',
        },
      }).toBe(dedent(`
        a.b -> with {
          head odiamond
          tail crow
          line solid
        }
      `))
    })

    it('should print expression with and where', () => {
      expectModelExpr({
        customRelation: {
          expr: {
            where: {
              expr: {
                inout: expr,
              },
              condition,
            },
          },
          head: 'odiamond',
          tail: 'crow',
          line: 'solid',
        },
      }).toBe(dedent(`
        -> a.b.* ->
          where
            tag is #tag1
            and kind is not system
          with {
            head odiamond
            tail crow
            line solid
          }
      `))
    })
  })
})

function expectFqnExpr(expr: FqnExpr.Any) {
  const exec = withctx(expr)
  return viExpect(
    materialize(exec(fqnExprAny())).trimEnd(),
  )
}

describe('fqnExprAny', () => {
  const modelRef = {
    model: 'a.b',
  }
  const deploymentRef = {
    deployment: 'prod.eu',
  }
  const insideInstanceRef = {
    deployment: 'prod.eu',
    element: 'backend',
  }
  const condition = {
    and: [
      { tag: 'tag1' },
      { kind: { neq: 'system' } },
    ],
  } satisfies WhereOperator

  describe('fqnExpr', () => {
    it('should print wildcard', () => {
      expectFqnExpr({
        wildcard: true,
      }).toBe('*')
    })

    it('should print model ref', () => {
      expectFqnExpr({
        ref: modelRef,
      }).toBe('a.b')
    })

    it('should print model ref with selector', () => {
      expectFqnExpr({
        ref: modelRef,
        selector: 'children',
      }).toBe('a.b.*')

      expectFqnExpr({
        ref: modelRef,
        selector: 'descendants',
      }).toBe('a.b.**')

      expectFqnExpr({
        ref: modelRef,
        selector: 'expanded',
      }).toBe('a.b._')
    })

    it('should print deployment ref', () => {
      expectFqnExpr({
        ref: deploymentRef,
      }).toBe('prod.eu')
    })

    it('should print deployment ref with selector', () => {
      expectFqnExpr({
        ref: deploymentRef,
        selector: 'children',
      }).toBe('prod.eu.*')

      expectFqnExpr({
        ref: deploymentRef,
        selector: 'descendants',
      }).toBe('prod.eu.**')
    })

    it('should print inside instance ref', () => {
      expectFqnExpr({
        ref: insideInstanceRef,
      }).toBe('prod.eu.backend')
    })

    it('should print inside instance ref with selector', () => {
      expectFqnExpr({
        ref: insideInstanceRef,
        selector: 'expanded',
      }).toBe('prod.eu.backend._')
    })

    it('should print element kind equal', () => {
      expectFqnExpr({
        elementKind: 'system',
        isEqual: true,
      }).toBe('element.kind = system')
    })

    it('should print element kind not equal', () => {
      expectFqnExpr({
        elementKind: 'system',
        isEqual: false,
      }).toBe('element.kind != system')
    })

    it('should print element tag equal', () => {
      expectFqnExpr({
        elementTag: 'deprecated',
        isEqual: true,
      }).toBe('element.tag = #deprecated')
    })

    it('should print element tag not equal', () => {
      expectFqnExpr({
        elementTag: 'deprecated',
        isEqual: false,
      }).toBe('element.tag != #deprecated')
    })
  })

  describe('fqnExprOrWhere', () => {
    it('should print where with model ref', () => {
      expectFqnExpr({
        where: {
          expr: {
            ref: modelRef,
            selector: 'children',
          },
          condition,
        },
      }).toBe(dedent(`
        a.b.*
          where
            tag is #tag1
            and kind is not system
      `))
    })

    it('should print where with deployment ref', () => {
      expectFqnExpr({
        where: {
          expr: {
            ref: deploymentRef,
          },
          condition,
        },
      }).toBe(dedent(`
        prod.eu
          where
            tag is #tag1
            and kind is not system
      `))
    })

    it('should print where with wildcard', () => {
      expectFqnExpr({
        where: {
          expr: {
            wildcard: true,
          },
          condition: { tag: 'tag1' },
        },
      }).toBe(dedent(`
        *
          where
            tag is #tag1
      `))
    })
  })

  describe('fqnCustomExpr', () => {
    it('should print custom with model ref', () => {
      expectFqnExpr({
        custom: {
          expr: {
            ref: modelRef,
            selector: 'children',
          },
          shape: 'browser',
          title: 'override',
          navigateTo: 'other-view' as ViewId<string>,
          description: { md: '**markdown**' },
        },
      }).toBe(dedent(`
        a.b.* with {
          title 'override'
          description '''
            **markdown**
          '''
          navigateTo other-view
          shape browser
        }
      `))
    })

    it('should print custom with deployment ref', () => {
      expectFqnExpr({
        custom: {
          expr: {
            ref: deploymentRef,
          },
          color: 'green',
        },
      }).toBe(dedent(`
        prod.eu with {
          color green
        }
      `))
    })

    it('should print custom with where and with', () => {
      expectFqnExpr({
        custom: {
          expr: {
            where: {
              expr: {
                ref: deploymentRef,
                selector: 'descendants',
              },
              condition,
            },
          },
          shape: 'browser',
        },
      }).toBe(dedent(`
        prod.eu.**
          where
            tag is #tag1
            and kind is not system
          with {
            shape browser
          }
      `))
    })
  })
})

function expectExpression(expr: Expression) {
  const exec = withctx(expr)
  return viExpect(
    materialize(exec(expression())).trimEnd(),
  )
}

describe('expression', () => {
  const modelRef = {
    model: 'a.b',
  }
  const deploymentRef = {
    deployment: 'prod.eu',
  }
  const expr = {
    ref: modelRef,
    selector: 'children' as const,
  }
  const deploymentExpr = {
    ref: deploymentRef,
    selector: 'descendants' as const,
  }
  const condition = {
    and: [
      { tag: 'tag1' },
      { kind: { neq: 'system' } },
    ],
  } satisfies WhereOperator

  describe('relation with model refs', () => {
    it('should print direct expression', () => {
      expectExpression({
        source: expr,
        target: { ref: modelRef },
      }).toBe('a.b.* -> a.b')
    })

    it('should print bidirectional expression', () => {
      expectExpression({
        source: expr,
        target: { ref: modelRef },
        isBidirectional: true,
      }).toBe('a.b.* <-> a.b')
    })

    it('should print incoming expression', () => {
      expectExpression({
        incoming: expr,
      }).toBe('-> a.b.*')
    })

    it('should print outgoing expression', () => {
      expectExpression({
        outgoing: expr,
      }).toBe('a.b.* ->')
    })

    it('should print in-out expression', () => {
      expectExpression({
        inout: expr,
      }).toBe('-> a.b.* ->')
    })
  })

  describe('relation with deployment refs', () => {
    it('should print direct with deployment endpoints', () => {
      expectExpression({
        source: { ref: deploymentRef },
        target: expr,
      }).toBe('prod.eu -> a.b.*')
    })

    it('should print incoming with deployment ref', () => {
      expectExpression({
        incoming: deploymentExpr,
      }).toBe('-> prod.eu.**')
    })

    it('should print outgoing with deployment ref', () => {
      expectExpression({
        outgoing: { ref: deploymentRef },
      }).toBe('prod.eu ->')
    })

    it('should print in-out with deployment ref', () => {
      expectExpression({
        inout: deploymentExpr,
      }).toBe('-> prod.eu.** ->')
    })
  })

  describe('relation where', () => {
    it('should print relation where', () => {
      expectExpression({
        where: {
          expr: {
            source: deploymentExpr,
            target: { ref: modelRef },
            isBidirectional: true,
          },
          condition,
        },
      }).toBe(dedent(`
        prod.eu.** <-> a.b
          where
            tag is #tag1
            and kind is not system
      `))
    })
  })

  describe('relation custom', () => {
    it('should print relation with', () => {
      expectExpression({
        customRelation: {
          expr: {
            outgoing: { ref: deploymentRef },
          },
          head: 'odiamond',
          tail: 'crow',
          line: 'solid',
        },
      }).toBe(dedent(`
        prod.eu -> with {
          head odiamond
          tail crow
          line solid
        }
      `))
    })

    it('should print relation where and with', () => {
      expectExpression({
        customRelation: {
          expr: {
            where: {
              expr: {
                inout: deploymentExpr,
              },
              condition,
            },
          },
          head: 'odiamond',
          tail: 'crow',
          line: 'solid',
        },
      }).toBe(dedent(`
        -> prod.eu.** ->
          where
            tag is #tag1
            and kind is not system
          with {
            head odiamond
            tail crow
            line solid
          }
      `))
    })
  })

  describe('dispatches fqnExpr variants', () => {
    it('should print wildcard', () => {
      expectExpression({
        wildcard: true,
      }).toBe('*')
    })

    it('should print deployment ref', () => {
      expectExpression({
        ref: deploymentRef,
      }).toBe('prod.eu')
    })

    it('should print fqn custom', () => {
      expectExpression({
        custom: {
          expr: { ref: deploymentRef },
          color: 'green',
        },
      }).toBe(dedent(`
        prod.eu with {
          color green
        }
      `))
    })
  })
})
