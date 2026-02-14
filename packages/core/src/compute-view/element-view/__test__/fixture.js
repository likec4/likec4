import { indexBy, isString, map, prop } from 'remeda';
import { LikeC4Model } from '../../../model';
import { ModelFqnExpr, ModelRelationExpr, } from '../../../types';
import { withReadableEdges } from '../../utils/with-readable-edges';
import { computeElementView } from '../compute';
const el = ({ id, kind, title, style, tags, ...props }) => ({
    id: id,
    kind: kind,
    title: title ?? id,
    description: null,
    technology: null,
    tags: tags ?? null,
    links: null,
    style: {
        ...style,
    },
    ...props,
});
export const fakeElements = {
    'customer': el({
        id: 'customer',
        kind: 'actor',
        title: 'customer',
        description: { txt: 'fufll description' },
        summary: { txt: 'short description' },
        style: {
            shape: 'person',
        },
    }),
    'support': el({
        id: 'support',
        kind: 'actor',
        title: 'support',
        style: {
            shape: 'person',
        },
        description: { txt: 'description' },
    }),
    'cloud': el({
        id: 'cloud',
        kind: 'system',
        title: 'cloud',
        style: {
            icon: 'none',
        },
        tags: ['next', 'old'],
    }),
    'cloud.backend': el({
        id: 'cloud.backend',
        kind: 'container',
        title: 'backend',
    }),
    'cloud.frontend': el({
        id: 'cloud.frontend',
        kind: 'container',
        title: 'frontend',
        style: {
            shape: 'browser',
        },
    }),
    'cloud.backend.graphql': el({
        id: 'cloud.backend.graphql',
        kind: 'component',
        style: {
            icon: 'tech:graphql',
        },
        title: 'graphql',
    }),
    'email': el({
        id: 'email',
        kind: 'system',
        title: 'email',
    }),
    'cloud.backend.storage': el({
        id: 'cloud.backend.storage',
        kind: 'component',
        title: 'storage',
        tags: ['storage', 'old'],
    }),
    'cloud.frontend.dashboard': el({
        id: 'cloud.frontend.dashboard',
        kind: 'component',
        title: 'dashboard',
        style: {
            icon: 'tech:react',
        },
        tags: ['next'],
    }),
    'cloud.frontend.supportPanel': el({
        id: 'cloud.frontend.supportPanel',
        kind: 'component',
        title: 'adminPanel',
        tags: ['old'],
    }),
    'amazon': el({
        id: 'amazon',
        kind: 'system',
        title: 'amazon',
        style: {
            icon: 'tech:aws',
        },
        tags: ['aws'],
    }),
    'amazon.s3': el({
        id: 'amazon.s3',
        kind: 'component',
        title: 's3',
        style: {
            shape: 'storage',
            icon: 'aws:s3',
        },
        tags: ['aws', 'storage'],
    }),
};
const rel = ({ source, target, title, ...props }) => ({
    id: `${source}:${target}`,
    title: title ?? '',
    source: {
        model: source,
    },
    target: {
        model: target,
    },
    ...props,
});
export const fakeRelations = [
    rel({
        source: 'customer',
        target: 'cloud.frontend.dashboard',
        title: 'opens in browser',
    }),
    rel({
        source: 'support',
        target: 'cloud.frontend.supportPanel',
        title: 'manages',
    }),
    rel({
        source: 'cloud.backend.storage',
        target: 'amazon.s3',
        title: 'uploads',
        tags: ['aws', 'storage', 'legacy'],
    }),
    rel({
        source: 'customer',
        target: 'cloud',
        title: 'uses',
    }),
    rel({
        source: 'cloud.backend.graphql',
        target: 'cloud.backend.storage',
        title: 'stores',
        tags: ['old', 'storage'],
    }),
    rel({
        source: 'cloud.frontend',
        target: 'cloud.backend',
        title: 'requests',
    }),
    rel({
        source: 'cloud.frontend.dashboard',
        target: 'cloud.backend.graphql',
        kind: 'graphlql',
        title: 'requests',
        line: 'solid',
        tags: ['next'],
    }),
    rel({
        source: 'cloud.frontend.supportPanel',
        target: 'cloud.backend.graphql',
        kind: 'graphlql',
        title: 'fetches',
        line: 'dashed',
        tail: 'odiamond',
        tags: ['old'],
    }),
    rel({
        source: 'cloud',
        target: 'amazon',
        title: 'uses',
        head: 'diamond',
        tail: 'odiamond',
        tags: ['aws'],
    }),
    rel({
        source: 'cloud.backend',
        target: 'email',
        title: 'schedule',
        tags: ['communication'],
    }),
    rel({
        source: 'cloud',
        target: 'email',
        title: 'uses',
        tags: ['communication'],
    }),
    rel({
        source: 'email',
        target: 'cloud',
        title: 'notifies',
        tags: ['communication'],
    }),
];
export const globalStyles = {
    'mute_old': [{
            targets: [$expr({
                    elementTag: 'old',
                    isEqual: true,
                })],
            style: {
                color: 'muted',
            },
        }],
    'red_next': [{
            targets: [$expr({
                    elementTag: 'next',
                    isEqual: true,
                })],
            style: {
                color: 'red',
            },
        }],
};
const fakeParsedModel = {
    _stage: 'computed',
    project: { id: 'test-project', config: { name: 'test-project' } },
    specification: {
        elements: {
            actor: {},
            system: {},
            container: {},
            component: {},
        },
        relationships: {
            graphlql: {},
        },
        deployments: {},
        tags: {
            old: {},
            next: {},
            aws: {},
            storage: {},
            communication: {},
            legacy: {},
        },
    },
    elements: fakeElements,
    relations: indexBy(fakeRelations, r => r.id),
    deployments: {
        elements: {},
        relations: {},
    },
    views: {},
    imports: {},
    globals: {
        predicates: {
            'remove_tag_old': [
                $exclude('*', {
                    tag: { eq: 'old' },
                }),
            ],
            'remove_not_tag_old': [
                $exclude('*', {
                    tag: { neq: 'old' },
                }),
            ],
            'include_next': [
                $include('* -> *', {
                    where: {
                        and: [
                            {
                                or: [
                                    { tag: { eq: 'communication' } },
                                    { tag: { eq: 'next' } },
                                    { tag: { eq: 'old' } },
                                ],
                            },
                            { tag: { neq: 'storage' } },
                        ],
                    },
                }),
            ],
        },
        dynamicPredicates: {},
        styles: globalStyles,
    },
};
export const fakeModel = LikeC4Model.fromDump(fakeParsedModel);
const emptyView = {
    _stage: 'parsed',
    _type: 'element',
    id: 'index',
    title: null,
    description: null,
    tags: null,
    links: null,
    rules: [],
};
export const includeWildcard = {
    include: [
        {
            wildcard: true,
        },
    ],
};
export function $custom(expr, props) {
    return {
        custom: {
            expr: $expr(expr),
            ...props,
        },
    };
}
export function $customRelation(relation, props) {
    return {
        customRelation: {
            expr: $expr(relation),
            ...props,
        },
    };
}
export function $where(expr, operator) {
    return {
        where: {
            expr: $expr(expr),
            condition: operator,
        },
    };
}
export function $participant(participant, operator) {
    return {
        participant,
        operator,
    };
}
export function $inout(expr) {
    const innerExpression = !isString(expr)
        ? expr
        : $expr(expr.replace(/->/g, '').trim());
    return { inout: innerExpression };
}
export function $incoming(expr) {
    const innerExpression = !isString(expr)
        ? expr
        : $expr(expr.replace('-> ', ''));
    return { incoming: innerExpression };
}
export function $outgoing(expr) {
    const innerExpression = !isString(expr)
        ? expr
        : $expr(expr.replace(' ->', ''));
    return { outgoing: innerExpression };
}
export function $relation(expr) {
    const [source, target] = expr.split(/ -> | <-> /);
    const isBidirectional = expr.includes(' <-> ');
    return {
        source: $expr(source),
        target: $expr(target),
        ...(isBidirectional && { isBidirectional }),
    };
}
export function $expr(expr) {
    if (!isString(expr)) {
        return expr;
    }
    if (expr === '*') {
        return { wildcard: true };
    }
    if (expr.startsWith('->')) {
        return expr.endsWith('->') ? $inout(expr) : $incoming(expr);
    }
    if (expr.endsWith(' ->')) {
        return $outgoing(expr);
    }
    if (expr.includes(' -> ') || expr.includes(' <-> ')) {
        return $relation(expr);
    }
    if (expr.endsWith('._')) {
        return {
            ref: {
                model: expr.replace('._', ''),
            },
            selector: 'expanded',
        };
    }
    if (expr.endsWith('.*')) {
        return {
            ref: {
                model: expr.replace('.*', ''),
            },
            selector: 'children',
        };
    }
    if (expr.endsWith('.**')) {
        return {
            ref: {
                model: expr.replace('.**', ''),
            },
            selector: 'descendants',
        };
    }
    return {
        ref: {
            model: expr,
        },
    };
}
export function $include(expr, props) {
    let _expr = props?.where ? $where(expr, props.where) : $expr(expr);
    _expr = props?.with ? $with(_expr, props.with) : _expr;
    return {
        include: [_expr],
    };
}
export function $with(expr, props) {
    if (ModelRelationExpr.is(expr) || ModelRelationExpr.isWhere(expr)) {
        return {
            customRelation: {
                expr,
                ...props,
            },
        };
    }
    else if (ModelFqnExpr.is(expr) || ModelFqnExpr.isWhere(expr)) {
        return {
            custom: {
                expr,
                ...props,
            },
        };
    }
    throw 'Unsupported type of internal expression';
}
export function $exclude(expr, where) {
    let _expr = where ? $where(expr, where) : $expr(expr);
    return {
        exclude: [_expr],
    };
}
export function $group(groupRules) {
    return {
        title: null,
        groupRules,
    };
}
export function $style(element, style) {
    return {
        targets: [$expr(element)],
        style: Object.assign({}, style),
    };
}
export function $global(expr) {
    const [_t, id] = expr.split(' ');
    switch (_t) {
        case 'predicate':
            return {
                predicateId: id,
            };
        case 'style':
            return {
                styleId: id,
            };
        default:
            throw new Error(`Invalid global expression: ${expr}`);
    }
}
export function computeView(...args) {
    let result;
    if (args.length === 1) {
        result = computeElementView(fakeModel, {
            ...emptyView,
            rules: [args[0]].flat(),
        });
    }
    else {
        result = computeElementView(fakeModel, {
            ...emptyView,
            viewOf: args[0],
            rules: [args[1]].flat(),
        });
    }
    result = withReadableEdges(result);
    return Object.assign(result, {
        nodeIds: map(result.nodes, prop('id')),
        edgeIds: map(result.edges, prop('id')),
    });
}
