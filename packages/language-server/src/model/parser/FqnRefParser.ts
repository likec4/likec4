import type * as c4 from '@likec4/core'
import { invariant, nonexhaustive } from '@likec4/core'
import { isNonNullish } from 'remeda'
import { ast } from '../../ast'
import { logWarnError } from '../../logger'
import { instanceRef } from '../../utils/deploymentRef'
import type { Base } from './Base'

export type WithFqnRef = ReturnType<typeof FqnRefParser>

export function FqnRefParser<TBase extends Base>(B: TBase) {
  return class FqnRefParserMixin extends B {
    parseFqnRef(node: ast.FqnRef): c4.FqnRef {
      const referenceable = node.value.ref
      invariant(referenceable, 'fqnRef value is missing')

      if (ast.isElement(referenceable)) {
        const instance = instanceRef(node)
        if (instance) {
          return {
            deployment: this.resolveFqn(instance),
            element: this.resolveFqn(referenceable)
          }
        }
        return {
          model: this.resolveFqn(referenceable)
        }
      }

      return {
        deployment: this.services.likec4.DeploymentsIndex.getFqnName(referenceable)
      }
    }

    parseFqnExpression(astNode: ast.FqnExpression): c4.FqnExpression.Element {
      if (ast.isWildcardExpression(astNode)) {
        return {
          wildcard: true
        }
      }
      if (ast.isFqnRefExpression(astNode)) {
        const ref = this.parseFqnRef(astNode.ref)
        switch (true) {
          case astNode.selector === '._':
            return {
              ref,
              selector: 'expanded'
            }
          case astNode.selector === '.**':
            return {
              ref,
              selector: 'descendants'
            }
          case astNode.selector === '.*':
            return {
              ref,
              selector: 'children'
            }
          default:
            return { ref }
        }
      }
      nonexhaustive(astNode)
    }

    parseFqnExpressions(astNode: ast.FqnExpressions): c4.FqnExpression.Element[] {
      const exprs = [] as c4.FqnExpression.Element[]
      let iter: ast.FqnExpressions['prev'] = astNode
      while (iter) {
        try {
          if (isNonNullish(iter.value) && this.isValid(iter.value)) {
            exprs.unshift(this.parseFqnExpression(iter.value))
          }
        } catch (e) {
          logWarnError(e)
        }
        iter = iter.prev
      }
      return exprs
    }
  }
}
