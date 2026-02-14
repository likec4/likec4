import { _type, invariant, isAncestor, } from '@likec4/core';
import { GrammarUtils } from 'langium';
import { entries, filter, findLast, isTruthy, last } from 'remeda';
import { TextEdit } from 'vscode-languageserver-types';
import { ast } from '../ast';
const { findNodeForKeyword } = GrammarUtils;
const asViewStyleRule = (target, style, indent = 0) => {
    const indentStr = indent > 0 ? ' '.repeat(indent) : '';
    return [
        indentStr + `style ${target} {`,
        ...entries(style).map(([key, value]) => indentStr + `  ${key} ${key === 'opacity' ? value.toString() + '%' : value}`),
        indentStr + `}`,
    ];
};
/**
 * - is ViewRuleStyle
 * - has exactly one target
 * - the target is an ElementRef to the given fqn
 */
const isMatchingViewRule = (fqn, index) => (rule) => {
    if (!ast.isViewRuleStyle(rule) && !ast.isDeploymentViewRuleStyle(rule)) {
        return false;
    }
    const target = rule.targets.value;
    if (!target || isTruthy(rule.targets.prev) || target.$type !== 'FqnRefExpr' || isTruthy(target.selector)) {
        return false;
    }
    const ref = target.ref?.value?.ref;
    const _fqn = ref ? index.resolve(ref) : null;
    return _fqn === fqn;
};
export function changeElementStyle(services, { view, viewAst, targets, style, }) {
    // Should never happen
    invariant(viewAst.body, `View ${view.id} has no body`);
    const viewCstNode = viewAst.$cstNode;
    invariant(viewCstNode, 'viewCstNode');
    const insertPos = last(viewAst.body.rules)?.$cstNode?.range.end
        ?? viewAst.body.$cstNode?.range.end;
    invariant(insertPos, 'insertPos is not defined');
    const indent = viewCstNode.range.start.character + 2;
    const fqnIndex = services.likec4.FqnIndex;
    const styleRules = filter(viewAst.body.rules, (r) => ast.isViewRuleStyle(r) || ast.isDeploymentViewRuleStyle(r));
    const viewOf = view[_type] === 'element' ? view.viewOf ?? null : null;
    // Find existing rules
    const existing = [];
    const insert = [];
    // const existingRules = [] as Array<{ fqn: Fqn, rule: ast.ViewRuleStyle }>
    targets.forEach(target => {
        const rule = findLast(styleRules, isMatchingViewRule(target, fqnIndex));
        // remove viewOf from the target to shorten the fqn
        const fqn = (viewOf && isAncestor(viewOf, target) ? target.substring(viewOf.length + 1) : target);
        if (rule) {
            existing.push({ fqn, rule });
        }
        else {
            insert.push({ fqn });
        }
    });
    const modifiedRange = {
        start: insertPos,
        end: insertPos,
    };
    const includeRange = (range) => {
        if (range.start.line <= modifiedRange.start.line) {
            if (range.start.line == modifiedRange.start.line) {
                modifiedRange.start.character = Math.min(range.start.character, modifiedRange.start.character);
            }
            else {
                modifiedRange.start = range.start;
            }
        }
        if (range.end.line >= modifiedRange.end.line) {
            if (range.end.line == modifiedRange.end.line) {
                modifiedRange.end.character = Math.max(range.end.character, modifiedRange.end.character);
            }
            else {
                modifiedRange.end = range.end;
            }
        }
    };
    const edits = [];
    if (insert.length > 0) {
        const linesToInsert = insert.flatMap(({ fqn }) => asViewStyleRule(fqn, style, indent));
        edits.push(TextEdit.insert(insertPos, '\n' + linesToInsert.join('\n')));
        modifiedRange.start = {
            line: insertPos.line + 1,
            character: indent,
        };
        modifiedRange.end = {
            line: insertPos.line + linesToInsert.length,
            character: (last(linesToInsert)?.length ?? 0),
        };
    }
    if (existing.length > 0) {
        for (const { rule } of existing) {
            const ruleCstNode = rule.$cstNode;
            invariant(ruleCstNode, 'RuleCstNode not found');
            for (const [key, _value] of entries(style)) {
                const value = key === 'opacity' ? _value.toString() + '%' : _value;
                const ruleProp = rule.props.find(p => p.key === key);
                // replace existing  property
                if (ruleProp && ruleProp.$cstNode) {
                    const { range: { start, end } } = ruleProp.$cstNode;
                    includeRange({
                        start,
                        end,
                    });
                    edits.push(TextEdit.replace({ start, end }, key + ' ' + value));
                    continue;
                }
                // insert new style property right after the opening brace
                const insertPos = findNodeForKeyword(ruleCstNode, '{')?.range.end;
                invariant(insertPos, 'Opening brace not found');
                const indentStr = ' '.repeat(ruleCstNode.range.start.character) + '\t';
                const insertKeyValue = indentStr + key + ' ' + value;
                edits.push(TextEdit.insert(insertPos, '\n' + insertKeyValue));
                includeRange({
                    start: {
                        line: insertPos.line + 1,
                        character: indentStr.length,
                    },
                    end: {
                        line: insertPos.line + 1,
                        character: insertKeyValue.length,
                    },
                });
            }
        }
    }
    return {
        modifiedRange,
        edits,
    };
}
