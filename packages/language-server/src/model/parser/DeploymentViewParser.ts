import type * as c4 from '@likec4/core'
import { FqnExpression, invariant, isNonEmptyArray, nonexhaustive } from '@likec4/core'
import { isNonNullish } from 'remeda'
import { ast, type ParsedAstDeploymentView, toAutoLayout, toElementStyle, ViewOps } from '../../ast'
import { logWarnError } from '../../logger'
import { stringHash } from '../../utils'
import { parseViewManualLayout } from '../../view-utils/manual-layout'
import { removeIndent, toSingleLine } from './Base'
import type { WithDeploymentModelParser } from './DeploymentModelParser'
import type { WithFqnRef } from './FqnRefParser'

export type WithDeploymentViewParser = ReturnType<typeof DeploymentViewParser>

const toDeploymentElementExpression = (ref: FqnExpression.Element): c4.DeploymentElementExpression => {
  invariant(!FqnExpression.Element.isModelRef(ref), 'Unexpected refence to model element')

  if (FqnExpression.Element.isWildcard(ref)) {
    return ref
  }
  if (FqnExpression.Element.isDeploymentRef(ref)) {
    return {
      ...ref.selector && { selector: ref.selector },
      ref: {
        id: ref.ref.deployment
      }
    }
  }
  nonexhaustive(ref)
}

export function DeploymentViewParser<TBase extends WithFqnRef & WithDeploymentModelParser>(B: TBase) {
  return class DeploymentViewParser extends B {
    parseDeploymentView(
      astNode: ast.DeploymentView
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
          astPath
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
        ...(manualLayout && { manualLayout })
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
      const exprs = [] as c4.DeploymentExpression[]
      let iterator: ast.DeploymentViewRulePredicateExpression | undefined = astRule.expr
      while (iterator) {
        try {
          const expr = iterator.value
          if (isNonNullish(expr) && this.isValid(expr)) {
            switch (true) {
              case ast.isDeploymentElementExpression(expr):
                exprs.unshift(this.parseDeploymentElementExpression(expr))
                break
              case ast.isDeploymentRelationExpression(expr):
                exprs.unshift(this.parseDeploymentRelationExpression(expr))
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
      const targets = this.parseFqnExpressions(astRule.targets).map(toDeploymentElementExpression)
      return {
        targets,
        ...(notation && { notation }),
        style: {
          ...toElementStyle(styleProps, this.isValid)
        }
      }
    }

    parseDeploymentElementExpression(astNode: ast.DeploymentElementExpression): c4.DeploymentExpression {
      if (ast.isWildcardExpression(astNode)) {
        return {
          wildcard: true
        }
      }
      if (ast.isDeploymentRefExpression(astNode)) {
        const ref = this.parseDeploymentDef(astNode.ref)
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

    parseDeploymentRelationExpression(astNode: ast.DeploymentRelationExpression): c4.DeploymentRelationExpression {
      if (ast.isDirectedDeploymentRelationExpression(astNode)) {
        return {
          source: this.convertFqnRefToDeploymentElementExpression(astNode.source.from),
          target: this.convertFqnRefToDeploymentElementExpression(astNode.target),
          isBidirectional: astNode.source.isBidirectional
        }
      }
      if (ast.isInOutDeploymentRelationExpression(astNode)) {
        return {
          inout: this.convertFqnRefToDeploymentElementExpression(astNode.inout.to)
        }
      }
      if (ast.isOutgoingDeploymentRelationExpression(astNode)) {
        return {
          outgoing: this.convertFqnRefToDeploymentElementExpression(astNode.from)
        }
      }
      if (ast.isIncomingDeploymentRelationExpression(astNode)) {
        return {
          incoming: this.convertFqnRefToDeploymentElementExpression(astNode.to)
        }
      }
      nonexhaustive(astNode)
    }

    convertFqnRefToDeploymentElementExpression(node: ast.FqnExpression): c4.DeploymentElementExpression {
      const ref = this.parseFqnExpression(node)
      invariant(!FqnExpression.Element.isModelRef(ref), 'Unexpected refence to model element')

      if (FqnExpression.Element.isWildcard(ref)) {
        return ref
      }
      if (FqnExpression.Element.isDeploymentRef(ref)) {
        return {
          ...ref.selector && { selector: ref.selector },
          ref: {
            id: ref.ref.deployment
          }
        }
      }
      nonexhaustive(ref)
    }
  }
}
