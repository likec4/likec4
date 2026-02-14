import * as c4 from '@likec4/core';
import { invariant, isNonEmptyArray, nonexhaustive } from '@likec4/core';
import { filter, find, isDefined, isEmpty, isNumber, isTruthy, last, mapToObj, pipe } from 'remeda';
import { ast, parseMarkdownAsString, toAutoLayout, toColor, ViewOps, } from '../../ast';
import { safeCall, stringHash } from '../../utils';
import { elementRef } from '../../utils/elementRef';
import { parseViewManualLayout } from '../../view-utils/manual-layout';
import { removeIndent, toSingleLine } from './Base';
export function ViewsParser(B) {
    return class ViewsParser extends B {
        parseViews() {
            const isValid = this.isValid;
            for (const viewBlock of this.doc.parseResult.value.views) {
                const localStyles = viewBlock.styles.flatMap(nd => {
                    try {
                        return isValid(nd) ? this.parseViewRuleStyleOrGlobalRef(nd) : [];
                    }
                    catch (e) {
                        this.logError(e, nd, 'views');
                        return [];
                    }
                });
                // Common folder for all views in the block
                const folder = viewBlock.folder && !isEmpty(viewBlock.folder.trim()) ? toSingleLine(viewBlock.folder) : null;
                for (const view of viewBlock.views) {
                    try {
                        if (!isValid(view)) {
                            continue;
                        }
                        switch (true) {
                            case ast.isElementView(view):
                                this.doc.c4Views.push(this.parseElementView(view, localStyles));
                                break;
                            case ast.isDynamicView(view):
                                this.doc.c4Views.push(this.parseDynamicElementView(view, localStyles));
                                break;
                            case ast.isDeploymentView(view):
                                this.doc.c4Views.push(this.parseDeploymentView(view));
                                break;
                            default:
                                nonexhaustive(view);
                        }
                        if (folder) {
                            const view = this.doc.c4Views.at(-1);
                            view.title = folder + ' / ' + (view.title || view.id);
                        }
                    }
                    catch (e) {
                        this.logError(e, view, 'views');
                    }
                }
            }
        }
        parseElementView(astNode, additionalStyles) {
            const body = astNode.body;
            invariant(body, 'ElementView body is not defined');
            const astPath = this.getAstNodePath(astNode);
            let viewOf = null;
            if ('viewOf' in astNode) {
                const viewOfEl = elementRef(astNode.viewOf);
                const _viewOf = viewOfEl && safeCall(() => this.resolveFqn(viewOfEl));
                if (!_viewOf) {
                    const viewId = astNode.name ?? 'unnamed';
                    const msg = astNode.viewOf.$cstNode?.text ?? '<unknown>';
                    this.logError(`viewOf ${viewId} not resolved ${msg}`, astNode.viewOf);
                }
                else {
                    viewOf = _viewOf;
                }
            }
            let id = astNode.name;
            if (!id) {
                id = 'view_' + stringHash(this.doc.uri.toString(), astPath, viewOf ?? '');
            }
            const { title = null, description = null } = this.parseBaseProps(pipe(body.props, filter(p => this.isValid(p)), filter(ast.isViewStringProperty), mapToObj(p => [p.key, p.value])));
            const tags = this.convertTags(body);
            const links = this.convertLinks(body);
            const manualLayout = parseViewManualLayout(astNode);
            const view = {
                [c4._type]: 'element',
                id: id,
                astPath,
                title: toSingleLine(title) ?? null,
                description,
                tags,
                links: isNonEmptyArray(links) ? links : null,
                rules: [
                    ...additionalStyles,
                    ...this.tryMap('views', body.rules, r => this.parseElementViewRule(r)),
                ],
                ...(viewOf && { viewOf }),
                ...(manualLayout && { manualLayout }),
            };
            ViewOps.writeId(astNode, view.id);
            if ('extends' in astNode) {
                const extendsView = astNode.extends.view.ref;
                invariant(extendsView?.name, 'view extends is not resolved: ' + astNode.$cstNode?.text);
                return Object.assign(view, {
                    extends: extendsView.name,
                });
            }
            return view;
        }
        parseElementViewRule(astRule) {
            if (ast.isViewRulePredicate(astRule)) {
                return this.parseViewRulePredicate(astRule);
            }
            if (ast.isViewRuleGlobalPredicateRef(astRule)) {
                return this.parseViewRuleGlobalPredicateRef(astRule);
            }
            if (ast.isViewRuleStyleOrGlobalRef(astRule)) {
                return this.parseViewRuleStyleOrGlobalRef(astRule);
            }
            if (ast.isViewRuleAutoLayout(astRule)) {
                return toAutoLayout(astRule);
            }
            if (ast.isViewRuleGroup(astRule)) {
                return this.parseViewRuleGroup(astRule);
            }
            if (ast.isViewRuleRank(astRule)) {
                return this.parseViewRuleRank(astRule);
            }
            nonexhaustive(astRule);
        }
        parseViewRulePredicate(astNode) {
            const exprs = [];
            let predicate = astNode.exprs;
            while (predicate) {
                const { value, prev } = predicate;
                this.tryParse('views', value, () => {
                    const expr = this.parsePredicate(value);
                    exprs.unshift(expr);
                });
                if (!prev) {
                    break;
                }
                predicate = prev;
            }
            return astNode.isInclude ? { include: exprs } : { exclude: exprs };
        }
        parseViewRuleGlobalPredicateRef(astRule) {
            return {
                predicateId: astRule.predicate.$refText,
            };
        }
        parseViewRuleStyleOrGlobalRef(astRule) {
            if (ast.isViewRuleStyle(astRule)) {
                return this.parseViewRuleStyle(astRule);
            }
            if (ast.isViewRuleGlobalStyle(astRule)) {
                return this.parseViewRuleGlobalStyle(astRule);
            }
            nonexhaustive(astRule);
        }
        parseViewRuleGroup(astNode) {
            const groupRules = [];
            for (const rule of astNode.groupRules) {
                try {
                    if (!this.isValid(rule)) {
                        continue;
                    }
                    if (ast.isViewRulePredicate(rule)) {
                        groupRules.push(this.parseViewRulePredicate(rule));
                        continue;
                    }
                    if (ast.isViewRuleGroup(rule)) {
                        groupRules.push(this.parseViewRuleGroup(rule));
                        continue;
                    }
                    nonexhaustive(rule);
                }
                catch (e) {
                    this.logError(e, rule, 'views');
                }
            }
            return {
                title: toSingleLine(astNode.title) ?? null,
                groupRules,
                ...this.parseStyleProps(astNode.props),
            };
        }
        parseViewRuleRank(astRule) {
            const targets = this.parseFqnExpressions(astRule.targets).filter((e) => c4.ModelExpression.isFqnExpr(e));
            const rank = astRule.value ?? 'same';
            return {
                rank,
                targets,
            };
        }
        parseViewRuleStyle(astRule) {
            const targets = this.parseFqnExpressions(astRule.targets).filter((e) => c4.ModelExpression.isFqnExpr(e));
            const style = this.parseStyleProps(astRule.props.filter(ast.isStyleProperty));
            const notation = removeIndent(parseMarkdownAsString(astRule.props.find(ast.isNotationProperty)?.value));
            return {
                targets,
                style,
                ...(notation && { notation }),
            };
        }
        parseViewRuleGlobalStyle(astRule) {
            return {
                styleId: astRule.style.$refText,
            };
        }
        parseDynamicElementView(astNode, additionalStyles) {
            const body = astNode.body;
            invariant(body, 'DynamicElementView body is not defined');
            // only valid props
            const isValid = this.isValid;
            const props = body.props.filter(isValid);
            const astPath = this.getAstNodePath(astNode);
            let id = astNode.name;
            if (!id) {
                id = 'dynamic_' + stringHash(this.doc.uri.toString(), astPath);
            }
            const { title = null, description = null } = this.parseBaseProps(pipe(props, filter(ast.isViewStringProperty), mapToObj(p => [p.key, p.value])));
            const tags = this.convertTags(body);
            const links = this.convertLinks(body);
            ViewOps.writeId(astNode, id);
            const manualLayout = parseViewManualLayout(astNode);
            const variant = find(props, ast.isDynamicViewDisplayVariantProperty)?.value;
            return {
                [c4._type]: 'dynamic',
                id: id,
                astPath,
                title: toSingleLine(title) ?? null,
                description,
                tags,
                links: isNonEmptyArray(links) ? links : null,
                variant,
                rules: [
                    ...additionalStyles,
                    ...this.tryMap('views', body.rules, n => this.parseDynamicViewRule(n)),
                ],
                steps: this.tryMap('views', body.steps, n => {
                    if (ast.isDynamicViewParallelSteps(n)) {
                        return this.parseDynamicParallelSteps(n);
                    }
                    else {
                        return this.parseDynamicStep(n);
                    }
                }),
                ...(manualLayout && { manualLayout }),
            };
        }
        parseDynamicViewRule(astRule) {
            if (ast.isDynamicViewIncludePredicate(astRule)) {
                return this.parseDynamicViewIncludePredicate(astRule);
            }
            if (ast.isDynamicViewGlobalPredicateRef(astRule)) {
                return this.parseViewRuleGlobalPredicateRef(astRule);
            }
            if (ast.isViewRuleStyleOrGlobalRef(astRule)) {
                return this.parseViewRuleStyleOrGlobalRef(astRule);
            }
            if (ast.isViewRuleAutoLayout(astRule)) {
                return toAutoLayout(astRule);
            }
            nonexhaustive(astRule);
        }
        parseDynamicViewIncludePredicate(astRule) {
            const include = [];
            let iter = astRule.exprs;
            while (iter) {
                this.tryParse('views', iter.value, (value) => {
                    if (ast.isFqnExprOrWith(value)) {
                        const c4expr = this.parseElementPredicate(value);
                        include.unshift(c4expr);
                    }
                });
                iter = iter.prev;
            }
            return { include };
        }
        parseDynamicParallelSteps(node) {
            const parallelId = pathInsideDynamicView(node);
            const __parallel = this.tryMap('views', node.steps, s => this.parseDynamicStep(s));
            invariant(isNonEmptyArray(__parallel), 'Dynamic parallel steps must have at least one step');
            return {
                parallelId,
                __parallel,
            };
        }
        /**
         * @returns non-empty array in case of step chain A -> B -> C
         */
        parseDynamicStep(node) {
            if (ast.isDynamicStepSingle(node)) {
                return this.parseDynamicStepSingle(node);
            }
            const __series = this.recursiveParseDynamicStepChain(node);
            invariant(isNonEmptyArray(__series), 'Dynamic step chain must have at least one step');
            return {
                seriesId: pathInsideDynamicView(node),
                __series,
            };
        }
        recursiveParseDynamicStepChain(node, callstack) {
            if (ast.isDynamicStepSingle(node.source)) {
                if (!this.isValid(node.source)) {
                    return [];
                }
                const previous = this.parseDynamicStepSingle(node.source);
                // Head of the chain cannot be backward
                if (previous.isBackward) {
                    return [];
                }
                const thisStep = {
                    ...this.parseAbstractDynamicStep(node),
                    source: previous.target,
                };
                // if target is the same as source of previous step, then it is a backward step
                // A -> B -> A
                if (thisStep.target === previous.source) {
                    thisStep.isBackward = true;
                }
                else if (callstack) {
                    callstack.push([previous.source, previous.target]);
                    callstack.push([thisStep.source, thisStep.target]);
                }
                return [previous, thisStep];
            }
            callstack ??= [];
            const allprevious = this.recursiveParseDynamicStepChain(node.source, callstack);
            if (!isNonEmptyArray(allprevious) || !this.isValid(node)) {
                return [];
            }
            const previous = last(allprevious);
            const thisStep = {
                ...this.parseAbstractDynamicStep(node),
                source: previous.target,
            };
            const index = callstack.findIndex(([source, target]) => source === thisStep.target && target === thisStep.source);
            if (index !== -1) {
                thisStep.isBackward = true;
                callstack.splice(index, callstack.length - index);
            }
            else {
                callstack.push([thisStep.source, thisStep.target]);
            }
            return [...allprevious, thisStep];
        }
        parseDynamicStepSingle(node) {
            const sourceEl = elementRef(node.source);
            if (!sourceEl) {
                throw new Error('Invalid reference to source');
            }
            let baseStep = {
                ...this.parseAbstractDynamicStep(node),
                source: this.resolveFqn(sourceEl),
            };
            if (node.isBackward) {
                baseStep = {
                    ...baseStep,
                    source: baseStep.target,
                    target: baseStep.source,
                    isBackward: true,
                };
            }
            return baseStep;
        }
        parseAbstractDynamicStep(astnode) {
            const targetEl = elementRef(astnode.target);
            if (!targetEl) {
                throw new Error('Invalid reference to target');
            }
            const step = {
                target: this.resolveFqn(targetEl),
                astPath: pathInsideDynamicView(astnode),
            };
            const title = removeIndent(astnode.title);
            if (title) {
                step.title = title;
            }
            const kind = astnode.kind?.ref?.name ?? astnode.dotKind?.kind.ref?.name;
            if (kind) {
                step.kind = kind;
            }
            for (const prop of astnode.custom?.props ?? []) {
                try {
                    switch (true) {
                        case ast.isRelationNavigateToProperty(prop): {
                            const viewId = prop.value.view.ref?.name;
                            if (isTruthy(viewId)) {
                                step.navigateTo = viewId;
                            }
                            break;
                        }
                        case ast.isRelationStringProperty(prop):
                        case ast.isNotationProperty(prop): {
                            if (isDefined(prop.value)) {
                                if (prop.key === 'description') {
                                    const value = removeIndent(prop.value);
                                    if (value) {
                                        step.description = value;
                                    }
                                }
                                else {
                                    step[prop.key] = removeIndent(parseMarkdownAsString(prop.value)) ?? '';
                                }
                            }
                            break;
                        }
                        case ast.isNotesProperty(prop): {
                            if (isDefined(prop.value)) {
                                step[prop.key] = removeIndent(prop.value);
                            }
                            break;
                        }
                        case ast.isArrowProperty(prop): {
                            if (isDefined(prop.value)) {
                                step[prop.key] = prop.value;
                            }
                            break;
                        }
                        case ast.isColorProperty(prop): {
                            const value = toColor(prop);
                            if (isDefined(value)) {
                                step[prop.key] = value;
                            }
                            break;
                        }
                        case ast.isLineProperty(prop): {
                            if (isDefined(prop.value)) {
                                step[prop.key] = prop.value;
                            }
                            break;
                        }
                        default:
                            nonexhaustive(prop);
                    }
                }
                catch (e) {
                    this.logError(e, prop, 'views');
                }
            }
            return step;
        }
    };
}
function pathInsideDynamicView(_node) {
    let node = _node;
    let path = [];
    while (!ast.isDynamicViewBody(node)) {
        if (isNumber(node.$containerIndex)) {
            path.unshift(`@${node.$containerIndex}`);
        }
        path.unshift(`/${node.$containerProperty ?? '__invalid__'}`);
        node = node.$container;
    }
    return path.join('');
}
