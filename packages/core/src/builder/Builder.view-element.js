import { isString } from 'remeda';
// To hook types
const asTypedExpr = (expr) => {
    return expr;
};
export function $expr(expr) {
    if (!isString(expr)) {
        return expr;
    }
    if (expr === '*') {
        return asTypedExpr({ wildcard: true });
    }
    if (expr.startsWith('->')) {
        if (expr.endsWith('->')) {
            return asTypedExpr({
                inout: $expr(expr.replace(/->/g, '').trim()),
            });
        }
        return asTypedExpr({
            incoming: $expr(expr.replace('-> ', '')),
        });
    }
    if (expr.endsWith(' ->')) {
        return asTypedExpr({
            outgoing: $expr(expr.replace(' ->', '')),
        });
    }
    if (expr.includes(' <-> ')) {
        const [source, target] = expr.split(' <-> ');
        return asTypedExpr({
            source: $expr(source),
            target: $expr(target),
            isBidirectional: true,
        });
    }
    if (expr.includes(' -> ')) {
        const [source, target] = expr.split(' -> ');
        return asTypedExpr({
            source: $expr(source),
            target: $expr(target),
        });
    }
    if (expr.endsWith('._')) {
        return asTypedExpr({
            ref: {
                model: expr.replace('._', ''),
            },
            selector: 'expanded',
        });
    }
    if (expr.endsWith('.**')) {
        return asTypedExpr({
            ref: {
                model: expr.replace('.**', ''),
            },
            selector: 'descendants',
        });
    }
    if (expr.endsWith('.*')) {
        return asTypedExpr({
            ref: {
                model: expr.replace('.*', ''),
            },
            selector: 'children',
        });
    }
    return asTypedExpr({
        ref: {
            model: expr,
        },
    });
}
