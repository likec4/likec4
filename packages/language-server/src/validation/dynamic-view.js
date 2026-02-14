import { isAncestor } from '@likec4/core';
import { AstUtils } from 'langium';
import { isEmpty } from 'remeda';
import { ast } from '../ast';
import { elementRef } from '../utils/elementRef';
import { tryOrLog } from './_shared';
export const dynamicViewStepSingle = (services) => {
    const fqnIndex = services.likec4.FqnIndex;
    return tryOrLog((el, accept) => {
        const sourceEl = elementRef(el.source);
        const source = sourceEl && fqnIndex.getFqn(sourceEl);
        if (!source) {
            accept('error', 'Source not found (not parsed/indexed yet)', {
                node: el,
                property: 'source',
            });
        }
        const targetEl = elementRef(el.target);
        const target = targetEl && fqnIndex.getFqn(targetEl);
        if (!target) {
            accept('error', 'Target not found (not parsed/indexed yet)', {
                node: el,
                property: 'target',
            });
        }
        if (source && target && (isAncestor(source, target) || isAncestor(target, source))) {
            accept('error', 'Invalid parent-child relationship', {
                node: el,
            });
        }
    });
};
export const dynamicViewStepChain = (services) => {
    const fqnIndex = services.likec4.FqnIndex;
    return tryOrLog((el, accept) => {
        const source = el.source;
        if (ast.isDynamicStepSingle(source) && source.isBackward) {
            accept('error', 'Invalid chain after backward step', {
                node: el,
            });
        }
        const targetEl = elementRef(el.target);
        const target = targetEl && fqnIndex.getFqn(targetEl);
        if (!target) {
            accept('error', 'Target not found (not parsed/indexed yet)', {
                node: el,
                property: 'target',
            });
        }
    });
};
export const dynamicViewDisplayVariant = (_services) => {
    return tryOrLog((prop, accept) => {
        if (isEmpty(prop.value) || (prop.value !== 'diagram' && prop.value !== 'sequence')) {
            accept('error', 'Invalid display variant: "diagram" or "sequence" are allowed', {
                node: prop,
                property: 'value',
            });
            return;
        }
        if (!AstUtils.hasContainerOfType(prop, ast.isDynamicViewBody)) {
            accept('error', `Display mode can be defined only inside dynamic view`, {
                node: prop,
            });
        }
    });
};
