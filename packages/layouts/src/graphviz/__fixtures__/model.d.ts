import type { Fqn, RelationId } from '@likec4/core/types';
export declare const fakeElements: {
    cloud: Element;
    customer: Element;
    support: Element;
    'cloud.backend': Element;
    'cloud.frontend': Element;
    'cloud.backend.graphql': Element;
    'cloud.backend.storage': Element;
    'cloud.frontend.adminPanel': Element;
    'cloud.frontend.dashboard': Element;
    amazon: Element;
    'amazon.s3': Element;
};
export type FakeElementIds = keyof typeof fakeElements;
export declare const indexView: ElementView;
export declare const cloudView: ElementView;
export declare const cloud3levels: ElementView;
export declare const amazonView: ElementView;
export declare const issue577View: (icon: string) => ParsedElementView;
export declare const FakeModel: {
    readonly _type: "computed";
    readonly projectId: "test";
    readonly project: {
        readonly id: "test";
    };
    readonly elements: {
        cloud: Element;
        customer: Element;
        support: Element;
        'cloud.backend': Element;
        'cloud.frontend': Element;
        'cloud.backend.graphql': Element;
        'cloud.backend.storage': Element;
        'cloud.frontend.adminPanel': Element;
        'cloud.frontend.dashboard': Element;
        amazon: Element;
        'amazon.s3': Element;
    };
    readonly relations: {
        'customer:cloud.frontend.dashboard': {
            id: RelationId;
            source: {
                model: Fqn;
            };
            target: {
                model: Fqn;
            };
            title: string;
        };
        'support:cloud.frontend.adminPanel': {
            id: RelationId;
            source: {
                model: Fqn;
            };
            target: {
                model: Fqn;
            };
            title: string;
        };
        'cloud.backend.storage:amazon.s3': {
            id: RelationId;
            source: {
                model: Fqn;
            };
            target: {
                model: Fqn;
            };
            title: string;
            tail: string;
        };
        'cloud.backend.graphql:cloud.backend.storage': {
            id: RelationId;
            source: {
                model: Fqn;
            };
            target: {
                model: Fqn;
            };
            title: string;
        };
        'cloud.frontend.dashboard:cloud.backend.graphql': {
            id: RelationId;
            source: {
                model: Fqn;
            };
            target: {
                model: Fqn;
            };
            title: string;
        };
        'cloud.frontend.adminPanel:cloud.backend.graphql': {
            id: RelationId;
            source: {
                model: Fqn;
            };
            target: {
                model: Fqn;
            };
            title: string;
        };
    };
    readonly views: {};
    readonly specification: {
        readonly elements: {
            readonly actor: {};
            readonly system: {};
            readonly component: {};
        };
        readonly relationships: {};
        readonly deployments: {};
        readonly tags: {};
    };
    readonly deployments: {
        readonly elements: {};
        readonly relations: {};
    };
    readonly globals: {
        readonly dynamicPredicates: {};
        readonly predicates: {};
        readonly styles: {};
    };
    readonly imports: {};
};
