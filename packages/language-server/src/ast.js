// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.
import { nonexhaustive } from '@likec4/core/utils';
import { AstUtils, DocumentState } from 'langium';
import { clamp, isNullish, isTruthy } from 'remeda';
import * as ast from './generated/ast';
import { LikeC4LanguageMetaData } from './generated/module';
export { ast };
const idattr = Symbol.for('idattr');
export const ViewOps = {
    writeId(node, id) {
        node[idattr] = id;
        return node;
    },
    readId(node) {
        return node[idattr];
    },
};
export const ElementOps = {
    writeId(node, id) {
        if (isNullish(id)) {
            node[idattr] = undefined;
        }
        else {
            node[idattr] = id;
        }
        return node;
    },
    readId(node) {
        return node[idattr];
    },
};
export function isLikeC4LangiumDocument(doc) {
    return doc?.textDocument.languageId === LikeC4LanguageMetaData.languageId;
}
export function isParsedLikeC4LangiumDocument(doc) {
    return (isLikeC4LangiumDocument(doc)
        && doc.state == DocumentState.Validated
        && !!doc.c4Specification
        && !!doc.c4Elements
        && !!doc.c4ExtendElements
        && !!doc.c4ExtendDeployments
        && !!doc.c4ExtendRelations
        && !!doc.c4Relations
        && !!doc.c4Views
        && !!doc.c4Deployments
        && !!doc.c4DeploymentRelations
        && !!doc.c4Imports);
}
export function parseMarkdownAsString(node) {
    return node?.markdown || node?.text;
}
export function parseAstPercent(value) {
    const opacity = parseFloat(value);
    return isNaN(opacity) ? 100 : clamp(opacity, { min: 0, max: 100 });
}
export function parseAstOpacityProperty({ value }) {
    return parseAstPercent(value);
}
export function parseAstSizeValue({ value }) {
    switch (value) {
        case 'xs':
        case 'sm':
        case 'md':
        case 'lg':
        case 'xl':
            return value;
        case 'xsmall':
            return 'xs';
        case 'small':
            return 'sm';
        case 'medium':
            return 'md';
        case 'large':
            return 'lg';
        case 'xlarge':
            return 'xl';
        default:
            nonexhaustive(value);
    }
}
export function parseAstIconPositionValue({ value }) {
    switch (value) {
        case 'left':
        case 'right':
        case 'top':
        case 'bottom':
            return value;
        default:
            nonexhaustive(value);
    }
}
export function toRelationshipStyle(props, isValid) {
    const result = {};
    if (!props || props.length === 0) {
        return result;
    }
    for (const prop of props) {
        if (!isValid(prop)) {
            continue;
        }
        switch (true) {
            case ast.isColorProperty(prop): {
                const color = toColor(prop);
                if (isTruthy(color)) {
                    result.color = color;
                }
                break;
            }
            case ast.isLineProperty(prop): {
                result.line = prop.value;
                break;
            }
            case ast.isArrowProperty(prop): {
                switch (prop.key) {
                    case 'head': {
                        result.head = prop.value;
                        break;
                    }
                    case 'tail': {
                        result.tail = prop.value;
                        break;
                    }
                    default: {
                        nonexhaustive(prop);
                    }
                }
                break;
            }
            default: {
                nonexhaustive(prop);
            }
        }
    }
    return result;
}
export function toColor(astNode) {
    return astNode?.themeColor ?? astNode?.customColor?.$refText;
}
export function toAutoLayout(rule) {
    const rankSep = rule.rankSep;
    const nodeSep = rule.nodeSep;
    let direction;
    switch (rule.direction) {
        case 'TopBottom': {
            direction = 'TB';
            break;
        }
        case 'BottomTop': {
            direction = 'BT';
            break;
        }
        case 'LeftRight': {
            direction = 'LR';
            break;
        }
        case 'RightLeft': {
            direction = 'RL';
            break;
        }
        default:
            nonexhaustive(rule.direction);
    }
    return {
        direction,
        ...(nodeSep && { nodeSep }),
        ...(rankSep && { rankSep }),
    };
}
export function toAstViewLayoutDirection(c4) {
    switch (c4) {
        case 'TB': {
            return 'TopBottom';
        }
        case 'BT': {
            return 'BottomTop';
        }
        case 'LR': {
            return 'LeftRight';
        }
        case 'RL': {
            return 'RightLeft';
        }
        default:
            nonexhaustive(c4);
    }
}
// export function elementExpressionFromPredicate(predicate: ast.ElementPredicate): ast.ElementExpression {
//   if (ast.isElementExpression(predicate)) {
//     return predicate
//   }
//   if (ast.isElementPredicateWhere(predicate)) {
//     return predicate.subject
//   }
//   if (ast.isElementPredicateWith(predicate)) {
//     return elementExpressionFromPredicate(predicate.subject)
//   }
//   nonexhaustive(predicate)
// }
export function getViewRulePredicateContainer(el) {
    return AstUtils.getContainerOfType(el, (n) => {
        return ast.isViewRulePredicate(n) || ast.isDeploymentViewRulePredicate(n) || ast.isDynamicViewIncludePredicate(n);
    });
}
const _isModel = (astNode) => {
    return ast.isModel(astNode) ||
        ast.isElementBody(astNode) ||
        ast.isExtendElementBody(astNode) ||
        ast.isElementViewBody(astNode) ||
        ast.isDynamicViewBody(astNode) ||
        ast.isElementRef(astNode);
};
const _isDeployment = (astNode) => {
    return ast.isModelDeployments(astNode) ||
        ast.isDeploymentViewBody(astNode) ||
        ast.isDeploymentNodeBody(astNode) ||
        ast.isExtendDeploymentBody(astNode) ||
        ast.isDeployedInstanceBody(astNode);
};
export function isFqnRefInsideGlobals(astNode) {
    while (true) {
        if (_isDeployment(astNode) || _isModel(astNode)) {
            return false;
        }
        if (ast.isGlobals(astNode) || ast.isModelViews(astNode)) {
            return true;
        }
        if (astNode.$container) {
            astNode = astNode.$container;
        }
        else {
            return false;
        }
    }
}
export function isFqnRefInsideModel(astNode) {
    while (true) {
        if (_isDeployment(astNode)) {
            return false;
        }
        if (_isModel(astNode)) {
            return true;
        }
        if (astNode.$container) {
            astNode = astNode.$container;
        }
        else {
            return false;
        }
    }
}
export function isFqnRefInsideDeployment(astNode) {
    while (true) {
        if (_isModel(astNode)) {
            return false;
        }
        if (_isDeployment(astNode)) {
            return true;
        }
        if (astNode.$container) {
            astNode = astNode.$container;
        }
        else {
            return false;
        }
    }
}
