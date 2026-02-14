// oxlint-disable consistent-type-specifier-style
import { defu } from 'defu';
import { entries, filter, fromEntries, fromKeys, hasAtLeast, isArray, isFunction, isNullish, map, mapToObj, mapValues, pipe, } from 'remeda';
import { computeLikeC4Model } from '../compute-view/compute-view';
import { assignTagColors } from '../styles/assignTagColors';
import { _stage, _type, exact, FqnRef, isDeployedInstance, isElementView, isGlobalFqn, splitGlobalFqn, } from '../types';
import { DefaultMap, invariant } from '../utils';
import { isSameHierarchy, nameFromFqn, parentFqn } from '../utils/fqn';
import { $autoLayout, $exclude, $include, $rules, $style } from './Builder.view-common';
import { mkViewBuilder } from './Builder.views';
function ensureObj(value) {
    return isArray(value) ? fromKeys(value, _ => ({})) : value;
}
function validateSpec({ tags, elements, deployments, relationships, ...specification }) {
    const spectags = {};
    if (tags) {
        Object.assign(spectags, ensureObj(tags));
    }
    const _elements = ensureObj(elements);
    for (const [kind, spec] of entries(_elements)) {
        if (spec.tags) {
            for (const tag of spec.tags) {
                invariant(tag in spectags, `Invalid specification for element kind "${kind}": tag "${tag}" not found`);
            }
        }
    }
    const _deployments = ensureObj(deployments ?? {});
    for (const [kind, spec] of entries(_deployments)) {
        if (spec.tags) {
            for (const tag of spec.tags) {
                invariant(tag in spectags, `Invalid specification for deployment kind "${kind}": tag "${tag}" not found`);
            }
        }
    }
    return {
        ...specification,
        tags: spectags,
        elements: _elements,
        deployments: _deployments,
        relationships: ensureObj(relationships ?? {}),
    };
}
function toMarkdownOrString(input) {
    if (isNullish(input)) {
        return null;
    }
    if (typeof input === 'string') {
        return { txt: input };
    }
    return input;
}
function builder(_spec, _elements = new Map(), _relations = [], _views = new Map(), _globals = {
    predicates: {},
    dynamicPredicates: {},
    styles: {},
}, _deployments = new Map(), _deploymentRelations = [], _imports = new DefaultMap(() => new Map())) {
    const spec = validateSpec(_spec);
    const toLikeC4Specification = () => {
        return {
            elements: structuredClone(spec.elements),
            deployments: structuredClone(spec.deployments),
            relationships: structuredClone(spec.relationships),
            tags: assignTagColors(structuredClone(spec.tags)),
            ...(spec.metadataKeys ? { metadataKeys: spec.metadataKeys } : {}),
            customColors: {},
        };
    };
    const mapLinks = (links) => {
        if (!links || !hasAtLeast(links, 1)) {
            return undefined;
        }
        return map(links, l => (typeof l === 'string' ? { url: l } : l));
    };
    const createGenericView = (id, _props, builder) => {
        if (isFunction(_props)) {
            builder = _props;
            _props = {};
        }
        _props ??= {};
        const { links: _links = [], title = null, description = null, tags = [], ...props } = typeof _props === 'string' ? { title: _props } : { ..._props };
        const links = mapLinks(_links);
        return [
            exact({
                id: id,
                title,
                description: toMarkdownOrString(description),
                tags,
                links,
                _stage: 'parsed',
                ...props,
            }),
            builder,
        ];
    };
    const checkElementExists = (id) => {
        const [project, fqn] = splitGlobalFqn(id);
        const lookup = project ? _imports.get(project) : _elements;
        const el = lookup.get(fqn);
        invariant(el, `Element with id "${id}" not found`);
        return el;
    };
    const parseRelEndpoint = (endpoint) => {
        if (typeof endpoint === 'string') {
            const [project, model] = splitGlobalFqn(endpoint);
            if (project) {
                return { project, model };
            }
            return { model };
        }
        if ('project' in endpoint || 'deployment' in endpoint) {
            return endpoint;
        }
        return parseRelEndpoint(endpoint.model);
    };
    const self = {
        get Types() {
            throw new Error('Types are not available in runtime');
        },
        clone: () => {
            const imports = new DefaultMap(() => new Map());
            for (const [key, value] of _imports) {
                imports.set(key, structuredClone(value));
            }
            return builder(structuredClone(spec), structuredClone(_elements), structuredClone(_relations), structuredClone(_views), structuredClone(_globals), structuredClone(_deployments), structuredClone(_deploymentRelations), imports);
        },
        __addElement: (element) => {
            const [project, fqn] = splitGlobalFqn(element.id);
            const parent = parentFqn(fqn);
            const lookup = project ? _imports.get(project) : _elements;
            if (parent) {
                invariant(lookup.get(parent), `Parent element with id "${parent}" not found for element with id "${element.id}"`);
            }
            if (lookup.has(fqn)) {
                throw new Error(`Element with id "${element.id}" already exists`);
            }
            lookup.set(fqn, project ? { ...element, id: fqn } : element);
            return self;
        },
        __addRelation(relation) {
            const source = parseRelEndpoint(relation.source);
            const sourceFqn = FqnRef.flatten(source);
            const target = parseRelEndpoint(relation.target);
            const targetFqn = FqnRef.flatten(target);
            const sourceEl = checkElementExists(sourceFqn);
            const targetEl = checkElementExists(targetFqn);
            if (isGlobalFqn(sourceFqn) && isGlobalFqn(targetFqn)) {
                throw new Error('Cannot create relationship between global elements');
            }
            if (!isGlobalFqn(sourceFqn) && !isGlobalFqn(targetFqn)) {
                invariant(!isSameHierarchy(sourceEl, targetEl), 'Cannot create relationship between elements in the same hierarchy');
            }
            _relations.push({
                id: `rel${_relations.length + 1}`,
                ...relation,
                source: source,
                target: target,
            });
            return self;
        },
        __fqn(id) {
            invariant(id.trim() !== '', 'Id must be non-empty');
            return id;
        },
        __deploymentFqn(id) {
            invariant(id.trim() !== '', 'Id must be non-empty');
            return id;
        },
        __addSourcelessRelation() {
            throw new Error('Can be called only in nested model');
        },
        __addView: (view) => {
            if (_views.has(view.id)) {
                throw new Error(`View with id "${view.id}" already exists`);
            }
            if (isElementView(view) && 'viewOf' in view) {
                invariant(_elements.get(view.viewOf), `Invalid scoped view ${view.id}, wlement with id "${view.viewOf}" not found`);
            }
            _views.set(view.id, view);
            return self;
        },
        __addDeployment: (node) => {
            if (_deployments.has(node.id)) {
                throw new Error(`Deployment with id "${node.id}" already exists`);
            }
            const parent = parentFqn(node.id);
            if (parent) {
                invariant(_deployments.get(parent), `Parent element with id "${parent}" not found for node with id "${node.id}"`);
            }
            if (isDeployedInstance(node)) {
                invariant(parent, `Instance ${node.id} of ${node.element} must be deployed under a parent node`);
                invariant(_elements.get(node.element), `Instance "${node.id}" references non-existing element "${node.element}"`);
            }
            _deployments.set(node.id, node);
            return self;
        },
        __addDeploymentRelation: (relation) => {
            invariant(!isSameHierarchy(relation.source.deployment, relation.target.deployment), 'Cannot create relationship between elements in the same hierarchy');
            invariant(_deployments.has(relation.source.deployment), `Relation "${relation.source.deployment} -> ${relation.target.deployment}" references non-existing source`);
            invariant(_deployments.has(relation.target.deployment), `Relation "${relation.source.deployment} -> ${relation.target.deployment}" references non-existing target`);
            _deploymentRelations.push({
                id: `deploy_rel${_deploymentRelations.length + 1}`,
                ...relation,
            });
            return self;
        },
        build: (project) => ({
            [_stage]: 'parsed',
            projectId: typeof project === 'string' ? project : project?.id ?? 'from-builder',
            project: {
                id: typeof project === 'string' ? project : 'from-builder',
                ...(typeof project === 'object' && project !== null ? project : {}),
            },
            specification: toLikeC4Specification(),
            elements: fromEntries(structuredClone(Array.from(_elements.entries()))),
            relations: mapToObj(_relations, r => [r.id, structuredClone(r)]),
            globals: structuredClone(_globals),
            deployments: {
                elements: fromEntries(structuredClone(Array.from(_deployments.entries()))),
                relations: mapToObj(_deploymentRelations, r => [r.id, structuredClone(r)]),
            },
            views: fromEntries(structuredClone(Array.from(_views.entries()))),
            imports: pipe(Array.from(_imports.entries()), map(([projectId, elementsMap]) => [projectId, structuredClone([...elementsMap.values()])]), filter(([_, elements]) => elements.length > 0), fromEntries()),
        }),
        toLikeC4Model: (project) => {
            const parsed = self.build(project);
            return computeLikeC4Model(parsed);
        },
        helpers: () => ({
            model: {
                model: (...ops) => {
                    return (b) => {
                        return ops.reduce((b, op) => op(b), b);
                    };
                },
                rel: (source, target, _props) => {
                    return (b) => {
                        const { title = '', links: _links = [], description = null, notes = null, ...props } = defu(typeof _props === 'string' ? { title: _props } : { ..._props }, { title: null, links: null });
                        const links = mapLinks(_links);
                        b.__addRelation(exact({
                            source: {
                                model: source,
                            },
                            target: {
                                model: target,
                            },
                            title,
                            ...(description && { description: toMarkdownOrString(description) }),
                            ...(notes && { notes: toMarkdownOrString(notes) }),
                            links,
                            ...props,
                        }));
                        return b;
                    };
                },
                relTo: (target, _props) => {
                    return (b) => {
                        const { title = '', links, description = null, notes = null, ...props } = defu(typeof _props === 'string' ? { title: _props } : { ..._props }, { title: null, links: null });
                        b.__addSourcelessRelation(exact({
                            target: {
                                model: target,
                            },
                            title,
                            ...(description && { description: toMarkdownOrString(description) }),
                            ...(notes && { notes: toMarkdownOrString(notes) }),
                            links: mapLinks(links),
                            ...props,
                        }));
                        return b;
                    };
                },
                ...mapValues(spec.elements, ({ style: specStyle, ...spec }, kind) => (id, _props) => {
                    const add = ((b) => {
                        const { links, icon: _icon, color, shape, style, title, description, summary, ...props } = typeof _props === 'string' ? { title: _props } : { ..._props };
                        const icon = _icon ?? specStyle?.icon;
                        const _id = b.__fqn(id);
                        b.__addElement(exact({
                            id: _id,
                            kind: kind,
                            title: title ?? nameFromFqn(_id),
                            ...(description && { description: toMarkdownOrString(description) }),
                            ...(summary && { summary: toMarkdownOrString(summary) }),
                            style: exact({
                                icon: icon,
                                color: color ?? specStyle?.color,
                                shape: shape ?? specStyle?.shape,
                                border: specStyle?.border,
                                opacity: specStyle?.opacity,
                                size: specStyle?.size,
                                padding: specStyle?.padding,
                                textSize: specStyle?.textSize,
                                ...style,
                            }),
                            links: mapLinks(links),
                            ...spec,
                            ...props,
                        }));
                        return b;
                    });
                    add.with = (...ops) => (b) => {
                        add(b);
                        const { __fqn, __addSourcelessRelation } = b;
                        try {
                            b.__fqn = (child) => `${__fqn(id)}.${child}`;
                            b.__addSourcelessRelation = (relation) => {
                                return b.__addRelation({
                                    ...relation,
                                    source: {
                                        model: __fqn(id),
                                    },
                                });
                            };
                            ops.reduce((b, op) => op(b), b);
                        }
                        finally {
                            b.__fqn = __fqn;
                            b.__addSourcelessRelation = __addSourcelessRelation;
                        }
                        return b;
                    };
                    return add;
                }),
            },
            views: {
                views: (...ops) => {
                    return (b) => {
                        return ops.reduce((b, op) => op(b), b);
                    };
                },
                view: (id, _props, _builder) => {
                    const [generic, builder] = createGenericView(id, _props, _builder);
                    const view = {
                        ...generic,
                        [_type]: 'element',
                        rules: [],
                    };
                    const add = (b) => {
                        b.__addView(view);
                        if (builder) {
                            builder(mkViewBuilder(view));
                        }
                        return b;
                    };
                    add.with = (...ops) => (b) => {
                        add(b);
                        const elementViewBuilder = mkViewBuilder(view);
                        for (const op of ops) {
                            op(elementViewBuilder);
                        }
                        return b;
                    };
                    return add;
                },
                viewOf: (id, viewOf, _props, _builder) => {
                    const [generic, builder] = createGenericView(id, _props, _builder);
                    const view = {
                        ...generic,
                        viewOf: viewOf,
                        [_type]: 'element',
                        rules: [],
                    };
                    const add = (b) => {
                        b.__addView(view);
                        if (builder) {
                            builder(mkViewBuilder(view));
                        }
                        return b;
                    };
                    add.with = (...ops) => (b) => {
                        add(b);
                        const elementViewBuilder = mkViewBuilder(view);
                        for (const op of ops) {
                            op(elementViewBuilder);
                        }
                        return b;
                    };
                    return add;
                },
                deploymentView: (id, _props, _builder) => {
                    const [generic, builder] = createGenericView(id, _props, _builder);
                    const view = {
                        ...generic,
                        [_type]: 'deployment',
                        rules: [],
                    };
                    const add = (b) => {
                        b.__addView(view);
                        if (builder) {
                            builder(mkViewBuilder(view));
                        }
                        return b;
                    };
                    add.with = (...ops) => (b) => {
                        add(b);
                        const elementViewBuilder = mkViewBuilder(view);
                        for (const op of ops) {
                            op(elementViewBuilder);
                        }
                        return b;
                    };
                    return add;
                },
                $autoLayout,
                $exclude,
                $include,
                $rules,
                $style,
            },
            deployment: {
                deployment: (...ops) => {
                    return (b) => {
                        return ops.reduce((b, op) => op(b), b);
                    };
                },
                instanceOf: (id, target, _props) => {
                    return (b) => {
                        if (isNullish(target)) {
                            target = id;
                            id = nameFromFqn(id);
                        }
                        else if (typeof target === 'string') {
                            _props ??= {};
                        }
                        else {
                            _props = target;
                            target = id;
                            id = nameFromFqn(id);
                        }
                        const { links, title, description, summary, icon, color, shape, style, ...props } = typeof _props === 'string' ? { title: _props } : { ..._props };
                        const _id = b.__deploymentFqn(id);
                        b.__addDeployment(exact({
                            id: _id,
                            element: target,
                            ...title && { title },
                            ...(summary && { summary: toMarkdownOrString(summary) }),
                            ...(description && { description: toMarkdownOrString(description) }),
                            style: exact({
                                icon: icon,
                                color,
                                shape,
                                ...style,
                            }),
                            links: mapLinks(links),
                            ...props,
                        }));
                        return b;
                    };
                },
                rel: (source, target, _props) => {
                    return (b) => {
                        const { title = null, links, description = null, notes = null, ...props } = typeof _props === 'string' ? { title: _props } : { ..._props };
                        b.__addDeploymentRelation(exact({
                            source: {
                                deployment: source,
                            },
                            target: {
                                deployment: target,
                            },
                            title,
                            ...description && { description: toMarkdownOrString(description) },
                            ...(notes && { notes: toMarkdownOrString(notes) }),
                            links: mapLinks(links),
                            ...props,
                        }));
                        return b;
                    };
                },
                ...mapValues(spec.deployments ?? {}, ({ style: specStyle, ...spec }, kind) => (id, _props) => {
                    const add = ((b) => {
                        const { links, icon: _icon, style, title, description, summary, color, shape, ...props } = typeof _props === 'string' ? { title: _props } : { ..._props };
                        const icon = _icon ?? specStyle?.icon;
                        const _id = b.__deploymentFqn(id);
                        b.__addDeployment(exact({
                            id: _id,
                            kind: kind,
                            title: title ?? nameFromFqn(_id),
                            ...(description && { description: toMarkdownOrString(description) }),
                            ...(summary && { summary: toMarkdownOrString(summary) }),
                            style: exact({
                                icon: icon,
                                color: color ?? specStyle?.color,
                                shape: shape ?? specStyle?.shape,
                                border: specStyle?.border,
                                opacity: specStyle?.opacity,
                                size: specStyle?.size,
                                padding: specStyle?.padding,
                                textSize: specStyle?.textSize,
                                ...style,
                            }),
                            links: mapLinks(links),
                            ...spec,
                            ...props,
                        }));
                        return b;
                    });
                    add.with =
                        (...ops) => (b) => {
                            add(b);
                            const { __deploymentFqn } = b;
                            try {
                                b.__deploymentFqn = (child) => `${__deploymentFqn(id)}.${child}`;
                                ops.reduce((b, op) => op(b), b);
                            }
                            finally {
                                b.__deploymentFqn = __deploymentFqn;
                            }
                            return b;
                        };
                    return add;
                }),
            },
        }),
        with: (...ops) => {
            const b = self.clone();
            return ops.reduce((b, op) => op(b), b);
        },
        model: (cb) => {
            const b = self.clone();
            const helpers = b.helpers().model;
            const _ = helpers.model;
            return cb({ ...helpers, _ }, _)(b);
        },
        deployment: (cb) => {
            const b = self.clone();
            const helpers = b.helpers().deployment;
            const _ = helpers.deployment;
            return cb({ ...helpers, _ }, _)(b);
        },
        views: (cb) => {
            const b = self.clone();
            const helpers = b.helpers().views;
            return cb({
                ...helpers,
                _: helpers.views,
            }, helpers.views)(b);
        },
    };
    return self;
}
export const Builder = {
    /**
     * Creates a builder with compositional methods
     *
     * @example
     * ```ts
     * const {
     *   model: { model, system, component, relTo },
     *   deployment: { env, vm},
     *   views: { view, $include },
     *   builder,
     * } = Builder.forSpecification({
     *   elements: {
     *     system: {},
     *     component: {},
     *   },
     *   deployments: ['env', 'vm'],
     * })
     *
     * const b = builder
     *   .with(
     *     model(
     *       system('cloud').with(
     *         component('backend'),
     *         component('backend.api'),
     *         component('frontend').with(
     *           relTo('cloud.backend.api'),
     *         ),
     *       ),
     *     ),
     *   )
     * ```
     */
    forSpecification(spec) {
        const b = builder(spec);
        return {
            ...b.helpers(),
            builder: b,
        };
    },
    /**
     * Creates a builder with chainable methods
     *
     * @example
     * ```ts
     * const b = Builder
     *   .specification({
     *     elements: ['system', 'component'],
     *     deployments: ['env', 'vm'],
     *   })
     *   .model(({ system, component, relTo }, _) =>
     *     _(
     *       system('cloud').with(
     *         component('backend').with(
     *           component('api'),
     *         ),
     *         component('frontend').with(
     *           relTo('cloud.backend.api'),
     *         )
     *       )
     *     )
     *   )
     * ```
     */
    specification(spec) {
        return builder(spec);
    },
};
