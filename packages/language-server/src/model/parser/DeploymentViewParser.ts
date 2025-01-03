import type * as c4 from '@likec4/core'
import { invariant, isNonEmptyArray, nonexhaustive } from '@likec4/core'
import { isNonNullish } from 'remeda'
import { type ParsedAstDeploymentView, ast, toAutoLayout, toElementStyle, ViewOps } from '../../ast'
import { logWarnError } from '../../logger'
import { stringHash } from '../../utils'
import { parseViewManualLayout } from '../../view-utils/manual-layout'
import { removeIndent, toSingleLine } from './Base'
import type { WithDeploymentModel } from './DeploymentModelParser'
import type { WithExpressionV2 } from './FqnRefParser'

export type WithDeploymentView = ReturnType<typeof DeploymentViewParser>

export function DeploymentViewParser<TBase extends WithExpressionV2 & WithDeploymentModel>(B: TBase) {
  return class DeploymentViewParser extends B {
    parseDeploymentView(
      astNode: ast.DeploymentView,
    ): ParsedAstDeploymentView {
      const body = astNode.body
      invariant(body, 'DynamicElementView body is not defined')
      // only valid props
      const props = body.props.filter(this.isValid)
      const astPath = this.getAstNodePath(astNode)

      let id = astNode.name
      if (!id) {
        id = 'deployment_' + stringHash(
          this.doc.uri.toString(),
          astPath,
        ) as c4.ViewId
      }

      const title = toSingleLine(props.find(p => p.key === 'title')?.value) ?? null
      const description = removeIndent(props.find(p => p.key === 'description')?.value) ?? null

      const tags = this.convertTags(body)
      const links = this.convertLinks(body)

      ViewOps.writeId(astNode, id as c4.ViewId)

      const manualLayout = parseViewManualLayout(astNode)

      return {
        __: 'deployment',
        id: id as c4.ViewId,
        astPath,
        title,
        description,
        tags,
        links: isNonEmptyArray(links) ? links : null,
        rules: body.rules.flatMap(n => {
          try {
            return this.isValid(n) ? this.parseDeploymentViewRule(n) : []
          } catch (e) {
            logWarnError(e)
            return []
          }
        }),
        ...(manualLayout && { manualLayout }),
      }
    }

    parseDeploymentViewRule(astRule: ast.DeploymentViewRule): c4.DeploymentViewRule {
      if (ast.isDeploymentViewRulePredicate(astRule)) {
        return this.parseDeploymentViewRulePredicate(astRule)
      }
      if (ast.isViewRuleAutoLayout(astRule)) {
        return toAutoLayout(astRule)
      }
      if (ast.isDeploymentViewRuleStyle(astRule)) {
        return this.parseDeploymentViewRuleStyle(astRule)
      }
      nonexhaustive(astRule)
    }

    parseDeploymentViewRulePredicate(astRule: ast.DeploymentViewRulePredicate): c4.DeploymentViewRulePredicate {
      const exprs = [] as c4.ExpressionV2[]
      let iterator: ast.DeploymentViewRulePredicateExpression | undefined = astRule.expr
      while (iterator) {
        try {
          const expr = iterator.value
          if (isNonNullish(expr) && this.isValid(expr)) {
            switch (true) {
              case ast.isFqnExpr(expr):
                exprs.unshift(this.parseFqnExpr(expr))
                break
              case ast.isRelationExpr(expr):
                exprs.unshift(this.parseRelationExpr(expr))
                break
              case ast.isRelationPredicateWhereV2(expr):
                exprs.unshift(this.parseRelationWhereExpr(expr))
                break
              default:
                nonexhaustive(expr)
            }
          }
        } catch (e) {
          logWarnError(e)
        }
        iterator = iterator.prev
      }
      return astRule.isInclude ? { include: exprs } : { exclude: exprs }
    }

    parseDeploymentViewRuleStyle(astRule: ast.DeploymentViewRuleStyle): c4.DeploymentViewRuleStyle {
      const styleProps = astRule.props.filter(ast.isStyleProperty)
      const notationProperty = astRule.props.find(ast.isNotationProperty)
      const notation = removeIndent(notationProperty?.value)
      const targets = this.parseFqnExpressions(astRule.targets)
      return {
        targets,
        ...(notation && { notation }),
        style: {
          ...toElementStyle(styleProps, this.isValid),
        },
      }
    }
  }
}
