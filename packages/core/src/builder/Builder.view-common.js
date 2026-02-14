import { isArray, isString, map } from 'remeda';
import { ModelFqnExpr } from '../types';
function parseWhere(where) {
    if (isString(where)) {
        const op = where;
        switch (true) {
            case op.startsWith('tag is not #'):
                return {
                    tag: {
                        neq: op.replace('tag is not #', ''),
                    },
                };
            case op.startsWith('tag is #'):
                return {
                    tag: {
                        eq: op.replace('tag is #', ''),
                    },
                };
            case op.startsWith('kind is not '):
                return {
                    kind: {
                        neq: op.replace('kind is not ', ''),
                    },
                };
            case op.startsWith('kind is '):
                return {
                    kind: {
                        eq: op.replace('kind is ', ''),
                    },
                };
            case op.startsWith('source.'):
                return {
                    operator: parseWhere(op.replace('source.', '')),
                    participant: 'source',
                };
            case op.startsWith('target.'):
                return {
                    operator: parseWhere(op.replace('target.', '')),
                    participant: 'target',
                };
            default:
                throw new Error(`Unknown where operator: ${where}`);
        }
    }
    if (where.and) {
        return {
            and: map(where.and, parseWhere),
        };
    }
    if (where.or) {
        return {
            or: map(where.or, parseWhere),
        };
    }
    if (where.not) {
        return {
            not: parseWhere(where.not),
        };
    }
    throw new Error(`Unknown where operator: ${where}`);
}
function $include(...args) {
    return (b) => {
        let expr = b.$expr(args[0]);
        if (args.length === 2) {
            const condition = args[1].where ? parseWhere(args[1].where) : undefined;
            if (condition) {
                expr = {
                    where: {
                        expr: expr,
                        condition,
                    },
                };
            }
            const custom = args[1].with;
            if (custom) {
                const isElement = ModelFqnExpr.is(expr);
                if (isElement) {
                    expr = {
                        custom: {
                            ...custom,
                            expr: expr,
                        },
                    };
                }
                else {
                    expr = {
                        customRelation: {
                            ...custom,
                            expr: expr,
                        },
                    };
                }
            }
        }
        b.include(expr);
        return b;
    };
}
function $exclude(...args) {
    return (b) => {
        let expr = b.$expr(args[0]);
        if (args.length === 2 && args[1].where) {
            const condition = parseWhere(args[1].where);
            expr = {
                where: {
                    expr: expr,
                    condition,
                },
            };
        }
        b.exclude(expr);
        return b;
    };
}
/**
 * @example
 *  builder.views(({ view, $style }, _) =>
 *    _(
 *      view('view1').with(
 *        $style('*', {
 *          color: 'red',
 *        }),
 *        $style(['bob', 'alice'], {
 *          color: 'blue',
 *        }),
 *      ),
 *    )
 *  )
 */
function $style(element, { notation, ...style }) {
    return (b) => b.style({
        targets: (isArray(element) ? element : [element]).map(e => b.$expr(e)),
        ...(notation ? { notation } : {}),
        style: {
            ...style,
        },
    });
}
function $autoLayout(layout) {
    return (b) => b.autoLayout(layout);
}
function $rules(...rules) {
    return (b) => rules.reduce((b, rule) => rule(b), b);
}
export { $autoLayout, $exclude, $include, $rules, $style };
