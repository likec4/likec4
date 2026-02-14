import { isString } from 'remeda';
export function $deploymentExpr(expr) {
    if (!isString(expr)) {
        return expr;
    }
    const asTypedDeploymentExpression = (expr) => {
        return expr;
    };
    if (expr === '*') {
        return asTypedDeploymentExpression({ wildcard: true });
    }
    if (expr.startsWith('->')) {
        if (expr.endsWith('->')) {
            return asTypedDeploymentExpression({
                inout: $deploymentExpr(expr.replace(/->/g, '').trim()),
            });
        }
        return asTypedDeploymentExpression({
            incoming: $deploymentExpr(expr.replace('-> ', '')),
        });
    }
    if (expr.endsWith(' ->')) {
        return asTypedDeploymentExpression({
            outgoing: $deploymentExpr(expr.replace(' ->', '')),
        });
    }
    if (expr.includes(' <-> ')) {
        const [source, target] = expr.split(' <-> ');
        return asTypedDeploymentExpression({
            source: $deploymentExpr(source),
            target: $deploymentExpr(target),
            isBidirectional: true,
        });
    }
    if (expr.includes(' -> ')) {
        const [source, target] = expr.split(' -> ');
        return asTypedDeploymentExpression({
            source: $deploymentExpr(source),
            target: $deploymentExpr(target),
        });
    }
    if (expr.endsWith('._')) {
        return asTypedDeploymentExpression({
            ref: {
                deployment: expr.replace('._', ''),
            },
            selector: 'expanded',
        });
    }
    if (expr.endsWith('.**')) {
        return asTypedDeploymentExpression({
            ref: {
                deployment: expr.replace('.**', ''),
            },
            selector: 'descendants',
        });
    }
    if (expr.endsWith('.*')) {
        return asTypedDeploymentExpression({
            ref: {
                deployment: expr.replace('.*', ''),
            },
            selector: 'children',
        });
    }
    return asTypedDeploymentExpression({
        ref: {
            deployment: expr,
        },
    });
}
