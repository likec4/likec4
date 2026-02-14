import * as c4 from '@likec4/core';
import { invariant, isNonEmptyArray, nonexhaustive } from '@likec4/core';
import { filter, isNonNullish, mapToObj, pipe } from 'remeda';
import { ast, parseMarkdownAsString, toAutoLayout, ViewOps } from '../../ast';
import { logWarnError } from '../../logger';
import { stringHash } from '../../utils';
import { parseViewManualLayout } from '../../view-utils/manual-layout';
import { removeIndent, toSingleLine } from './Base';
export function DeploymentViewParser(B) {
    return class DeploymentViewParser extends B {
        parseDeploymentView(astNode) {
            const body = astNode.body;
            invariant(body, 'DynamicElementView body is not defined');
            // only valid props
            const props = body.props.filter(this.isValid);
            const astPath = this.getAstNodePath(astNode);
            let id = astNode.name;
            if (!id) {
                id = 'deployment_' + stringHash(this.doc.uri.toString(), astPath);
            }
            const { title = null, description = null, } = this.parseBaseProps(pipe(props, filter(ast.isViewStringProperty), mapToObj(p => [p.key, p.value])));
            const tags = this.convertTags(body);
            const links = this.convertLinks(body);
            ViewOps.writeId(astNode, id);
            const manualLayout = parseViewManualLayout(astNode);
            return {
                [c4._type]: 'deployment',
                id: id,
                astPath,
                title: toSingleLine(title) ?? null,
                description,
                tags,
                links: isNonEmptyArray(links) ? links : null,
                rules: this.tryMap('deployment', body.rules, n => this.parseDeploymentViewRule(n)),
                ...(manualLayout && { manualLayout }),
            };
        }
        parseDeploymentViewRule(astRule) {
            if (ast.isDeploymentViewRulePredicate(astRule)) {
                return this.parseDeploymentViewRulePredicate(astRule);
            }
            if (ast.isViewRuleAutoLayout(astRule)) {
                return toAutoLayout(astRule);
            }
            if (ast.isDeploymentViewRuleStyle(astRule)) {
                return this.parseDeploymentViewRuleStyle(astRule);
            }
            nonexhaustive(astRule);
        }
        parseDeploymentViewRulePredicate(astRule) {
            const exprs = [];
            let iterator = astRule.expr;
            while (iterator) {
                try {
                    const expr = iterator.value;
                    if (isNonNullish(expr) && this.isValid(expr)) {
                        exprs.unshift(this.parseExpressionV2(expr));
                    }
                }
                catch (e) {
                    logWarnError(e);
                }
                iterator = iterator.prev;
            }
            return astRule.isInclude ? { include: exprs } : { exclude: exprs };
        }
        parseDeploymentViewRuleStyle(astRule) {
            const style = this.parseStyleProps(astRule.props.filter(ast.isStyleProperty));
            const notation = removeIndent(parseMarkdownAsString(astRule.props.find(ast.isNotationProperty)?.value));
            const targets = this.parseFqnExpressions(astRule.targets);
            return {
                targets,
                style,
                ...(notation && { notation }),
            };
        }
    };
}
