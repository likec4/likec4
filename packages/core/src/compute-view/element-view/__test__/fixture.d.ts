import { type Aux, type BorderStyle, type Color, type ComputedElementView, type ElementShape, type ElementViewPredicate, type ElementViewPredicate as ViewRulePredicate, type ElementViewRule, type ElementViewRuleGroup as ViewRuleGroup, type ElementViewRuleStyle as ViewRuleStyle, type KindEqual, type ModelExpression, type NonEmptyArray, type scalar, type SpecAux, type TagEqual, type ViewRuleGlobalPredicateRef, type ViewRuleGlobalStyle, type WhereOperator, ModelFqnExpr, ModelRelationExpr } from '../../../types';
import type { Participant } from '../../../types/operators';
/**
              ┌──────────────────────────────────────────────────┐
              │                      cloud                       │
              │  ┌───────────────────────────────────────────┐   │
              │  │                 frontend                  │   │
┏━━━━━━━━━━┓  │  │   ┏━━━━━━━━━━━━━┓   ┏━━━━━━━━━━━━━━━━┓    │   │   ┏━━━━━━━━━━━┓
┃          ┃  │  │   ┃             ┃   ┃                ┃    │   │   ┃           ┃
┃ customer ┃──┼──┼──▶┃  dashboard  ┃   ┃   adminpanel   ┃◀───┼───┼───┃  support  ┃
┃          ┃  │  │   ┃             ┃   ┃                ┃    │   │   ┃           ┃
┗━━━━━━━━━━┛  │  │   ┗━━━━━━┳━━━━━━┛   ┗━━━━━━━━┳━━━━━━━┛    │   │   ┗━━━━━━━━━━━┛
              │  └──────────┼───────────────────┼────────────┘   │
              │             ├───────────────────┘                │
              │             │                                    │
              │  ┌──────────┼────────────────────────────────┐   │
              │  │          ▼       backend                  │   │
              │  │   ┏━━━━━━━━━━━━━┓       ┏━━━━━━━━━━━━━┓   │   │
              │  │   ┃             ┃       ┃             ┃   │   │
              │  │   ┃  graphlql   ┃──────▶┃   storage   ┃   │   │
              │  │   ┃             ┃       ┃             ┃   │   │
              │  │   ┗━━━━━━━━━━━━━┛       ┗━━━━━━┳━━━━━━┛   │   │
              │  └────────────────────────────────┼──────────┘   │
              └───────────────────────────────────┼──────────────┘
                                                  │
                                        ┌─────────┼─────────┐
                                        │ amazon  │         │
                                        │         ▼         │
                                        │ ┏━━━━━━━━━━━━━━┓  │
                                        │ ┃              ┃  │
                                        │ ┃      s3      ┃  │
                                        │ ┃              ┃  │
                                        │ ┗━━━━━━━━━━━━━━┛  │
                                        └───────────────────┘

specification {
  element actor
  element system
  element container
  element component

  tag old
}

model {

  actor customer
  actor support

  system cloud {
    container backend {
      component graphql
      component storage {
        #old
      }

      graphql -> storage
    }

    container frontend {
      component dashboard {
        -> graphql
      }
      component adminPanel {
        #old
        -> graphql
      }
    }
  }

  customer -> dashboard
  support -> adminPanel

  system amazon {
    component s3

    cloud.backend.storage -> s3
  }

}

 */
type TestTag = 'old' | 'next' | 'aws' | 'storage' | 'communication' | 'legacy';
export declare const fakeElements: {
    customer: Element;
    support: Element;
    cloud: Element;
    'cloud.backend': Element;
    'cloud.frontend': Element;
    'cloud.backend.graphql': Element;
    email: Element;
    'cloud.backend.storage': Element;
    'cloud.frontend.dashboard': Element;
    'cloud.frontend.supportPanel': Element;
    amazon: Element;
    'amazon.s3': Element;
};
export type FakeElementIds = keyof typeof fakeElements;
export declare const fakeRelations: ((Omit<ModelRelation, "id"> & {
    id: "customer:cloud.frontend.dashboard";
}) | (Omit<ModelRelation, "id"> & {
    id: "support:cloud.frontend.supportPanel";
}) | (Omit<ModelRelation, "id"> & {
    id: "cloud.backend.storage:amazon.s3";
}) | (Omit<ModelRelation, "id"> & {
    id: "customer:cloud";
}) | (Omit<ModelRelation, "id"> & {
    id: "cloud.backend.graphql:cloud.backend.storage";
}) | (Omit<ModelRelation, "id"> & {
    id: "cloud.frontend:cloud.backend";
}) | (Omit<ModelRelation, "id"> & {
    id: "cloud.frontend.dashboard:cloud.backend.graphql";
}) | (Omit<ModelRelation, "id"> & {
    id: "cloud.frontend.supportPanel:cloud.backend.graphql";
}) | (Omit<ModelRelation, "id"> & {
    id: "cloud:amazon";
}) | (Omit<ModelRelation, "id"> & {
    id: "cloud.backend:email";
}) | (Omit<ModelRelation, "id"> & {
    id: "cloud:email";
}) | (Omit<ModelRelation, "id"> & {
    id: "email:cloud";
}))[];
export declare const globalStyles: {
    readonly mute_old: readonly [{
        readonly targets: readonly [ModelExpression<Aux<"computed", "cloud" | "cloud.backend" | "cloud.frontend" | "customer" | "email" | "cloud.frontend.dashboard" | "support" | "cloud.backend.graphql" | "cloud.backend.storage" | "cloud.frontend.supportPanel" | "amazon" | "amazon.s3", never, "index", never, SpecAux<"system" | "component" | "actor" | "container", never, "graphlql", TestTag, never>>>];
        readonly style: {
            readonly color: "muted";
        };
    }];
    readonly red_next: readonly [{
        readonly targets: readonly [ModelExpression<Aux<"computed", "cloud" | "cloud.backend" | "cloud.frontend" | "customer" | "email" | "cloud.frontend.dashboard" | "support" | "cloud.backend.graphql" | "cloud.backend.storage" | "cloud.frontend.supportPanel" | "amazon" | "amazon.s3", never, "index", never, SpecAux<"system" | "component" | "actor" | "container", never, "graphlql", TestTag, never>>>];
        readonly style: {
            readonly color: "red";
        };
    }];
};
export type FakeRelationIds = (typeof fakeRelations)[number]['id'];
declare const fakeParsedModel: {
    readonly _stage: "computed";
    readonly project: {
        readonly id: "test-project";
        readonly config: {
            readonly name: "test-project";
        };
    };
    readonly specification: {
        readonly elements: {
            readonly actor: {};
            readonly system: {};
            readonly container: {};
            readonly component: {};
        };
        readonly relationships: {
            readonly graphlql: {};
        };
        readonly deployments: {};
        readonly tags: {
            readonly old: {};
            readonly next: {};
            readonly aws: {};
            readonly storage: {};
            readonly communication: {};
            readonly legacy: {};
        };
    };
    readonly elements: {
        customer: Element;
        support: Element;
        cloud: Element;
        'cloud.backend': Element;
        'cloud.frontend': Element;
        'cloud.backend.graphql': Element;
        email: Element;
        'cloud.backend.storage': Element;
        'cloud.frontend.dashboard': Element;
        'cloud.frontend.supportPanel': Element;
        amazon: Element;
        'amazon.s3': Element;
    };
    readonly relations: any;
    readonly deployments: {
        readonly elements: {};
        readonly relations: {};
    };
    readonly views: {};
    readonly imports: {};
    readonly globals: {
        readonly predicates: Record<string, NonEmptyArray<ElementViewPredicate<$Aux>>>;
        readonly dynamicPredicates: {};
        readonly styles: {
            readonly mute_old: readonly [{
                readonly targets: readonly [ModelExpression<Aux<"computed", "cloud" | "cloud.backend" | "cloud.frontend" | "customer" | "email" | "cloud.frontend.dashboard" | "support" | "cloud.backend.graphql" | "cloud.backend.storage" | "cloud.frontend.supportPanel" | "amazon" | "amazon.s3", never, "index", never, SpecAux<"system" | "component" | "actor" | "container", never, "graphlql", TestTag, never>>>];
                readonly style: {
                    readonly color: "muted";
                };
            }];
            readonly red_next: readonly [{
                readonly targets: readonly [ModelExpression<Aux<"computed", "cloud" | "cloud.backend" | "cloud.frontend" | "customer" | "email" | "cloud.frontend.dashboard" | "support" | "cloud.backend.graphql" | "cloud.backend.storage" | "cloud.frontend.supportPanel" | "amazon" | "amazon.s3", never, "index", never, SpecAux<"system" | "component" | "actor" | "container", never, "graphlql", TestTag, never>>>];
                readonly style: {
                    readonly color: "red";
                };
            }];
        };
    };
};
export declare const fakeModel: any;
export type $Aux = Aux<'computed', FakeElementIds, never, 'index', never, SpecAux<'actor' | 'system' | 'container' | 'component', never, 'graphlql', TestTag, never>>;
export declare const includeWildcard: ViewRule;
export type ElementRefExpr = '*' | FakeElementIds | `${FakeElementIds}.*` | `${FakeElementIds}.**` | `${FakeElementIds}._`;
type InOutExpr = `-> ${ElementRefExpr} ->`;
type IncomingExpr = `-> ${ElementRefExpr}`;
type OutgoingExpr = `${ElementRefExpr} ->`;
type RelationKeyword = '->' | '<->';
type RelationExpr = `${ElementRefExpr} ${RelationKeyword} ${ElementRefExpr}`;
export type Expression = ElementRefExpr | InOutExpr | IncomingExpr | OutgoingExpr | RelationExpr;
export declare function $custom(expr: ElementRefExpr, props: Omit<ModelFqnExpr.Custom<$Aux>['custom'], 'expr'>): ModelFqnExpr.Custom<$Aux>;
export declare function $customRelation(relation: ModelRelationExpr.OrWhere<$Aux>, props: Omit<ModelRelationExpr.Custom<$Aux>['customRelation'], 'expr'>): ModelRelationExpr.Custom<$Aux>;
export declare function $where(expr: Expression, operator: WhereOperator<$Aux>): ModelExpression.Where<$Aux>;
export declare function $where(expr: ModelRelationExpr<$Aux>, operator: WhereOperator<$Aux>): ModelRelationExpr.Where<$Aux>;
export declare function $where(expr: ModelFqnExpr<$Aux>, operator: WhereOperator<$Aux>): ModelFqnExpr.Where<$Aux>;
export declare function $participant(participant: Participant, operator: TagEqual<$Aux> | KindEqual<$Aux>): WhereOperator<$Aux>;
export declare function $inout(expr: InOutExpr | ModelFqnExpr<$Aux>): ModelRelationExpr.InOut<$Aux>;
export declare function $incoming(expr: IncomingExpr | ModelFqnExpr<$Aux>): ModelRelationExpr.Incoming<$Aux>;
export declare function $outgoing(expr: OutgoingExpr | ModelFqnExpr<$Aux>): ModelRelationExpr.Outgoing<$Aux>;
export declare function $relation(expr: RelationExpr): ModelRelationExpr.Direct<$Aux>;
export declare function $expr(expr: Expression | ModelExpression<$Aux>): ModelExpression<$Aux>;
export type CustomProps = {
    where?: WhereOperator<$Aux>;
    with?: {
        title?: string;
        description?: string | scalar.MarkdownOrString;
        technology?: string;
        shape?: ElementShape;
        color?: Color;
        border?: BorderStyle;
        icon?: string;
        opacity?: number;
        navigateTo?: string;
        notes?: string | scalar.MarkdownOrString;
        multiple?: boolean;
    } & Omit<ModelRelationExpr.Custom<$Aux>['customRelation'], 'expr' | 'navigateTo' | 'description' | 'notes'>;
};
export declare function $include(expr: Expression | ModelExpression<$Aux>, props?: CustomProps): ElementViewPredicate<$Aux>;
export declare function $with(expr: ModelExpression<$Aux>, props?: CustomProps['with']): ModelRelationExpr.Custom<$Aux> | ModelFqnExpr.Custom<$Aux>;
export declare function $exclude(expr: Expression | ModelExpression<$Aux>, where?: WhereOperator<$Aux>): ViewRulePredicate<$Aux>;
export declare function $group(groupRules: ViewRuleGroup<$Aux>['groupRules']): ViewRuleGroup<$Aux>;
export declare function $style(element: ElementRefExpr, style: ViewRuleStyle<$Aux>['style']): ViewRuleStyle<$Aux>;
type GlobalStyles = `style ${keyof typeof globalStyles}`;
type GlobalPredicate = `predicate ${keyof typeof fakeParsedModel.globals.predicates}`;
type GlobalExpr = GlobalStyles | GlobalPredicate;
export declare function $global(expr: GlobalExpr): ViewRuleGlobalStyle | ViewRuleGlobalPredicateRef;
export declare function computeView(...args: [FakeElementIds, ElementViewRule<$Aux> | ElementViewRule<$Aux>[]] | [
    ElementViewRule<$Aux> | ElementViewRule<$Aux>[]
]): ComputedElementView<$Aux> & {
    nodeIds: string[];
    edgeIds: string[];
};
export {};
