import type * as c4 from '@likec4/core';
import { MultiMap } from '@likec4/core/utils';
import type { AstNode, AstNodeDescription, DiagnosticInfo, LangiumDocument } from 'langium';
import type { ConditionalPick, MergeExclusive, Simplify, ValueOf, Writable } from 'type-fest';
import type { Diagnostic } from 'vscode-languageserver-types';
import type { LikeC4Grammar } from './generated/ast';
import * as ast from './generated/ast';
import type { IsValidFn } from './validation';
export { ast };
declare module 'langium' {
    interface LangiumDocument {
        likec4ProjectId?: c4.ProjectId;
    }
    interface AstNodeDescription {
        likec4ProjectId?: c4.ProjectId;
    }
}
declare const idattr: unique symbol;
declare module './generated/ast' {
    interface Element {
        [idattr]?: c4.Fqn | undefined;
    }
    interface ElementView {
        [idattr]?: c4.ViewId | undefined;
    }
    interface DynamicView {
        [idattr]?: c4.ViewId | undefined;
    }
    interface DeploymentView {
        [idattr]?: c4.ViewId | undefined;
    }
    interface DeploymentNode {
        [idattr]?: c4.Fqn | undefined;
    }
    interface DeployedInstance {
        [idattr]?: c4.Fqn | undefined;
    }
}
export type ParsedElementStyle = {
    shape?: c4.ElementShape;
    icon?: c4.IconUrl;
    iconColor?: c4.Color;
    iconSize?: c4.ShapeSize;
    iconPosition?: c4.IconPosition;
    color?: c4.Color;
    border?: c4.BorderStyle;
    opacity?: number;
    multiple?: boolean;
    size?: c4.ShapeSize;
    padding?: c4.SpacingSize;
    textSize?: c4.TextSize;
};
export interface ParsedAstSpecification {
    tags: Record<c4.Tag, {
        astPath: string;
        color?: c4.ColorLiteral;
    }>;
    elements: Record<c4.ElementKind, c4.ElementSpecification>;
    relationships: Record<c4.RelationshipKind, {
        technology?: string;
        notation?: string;
        color?: c4.Color;
        line?: c4.RelationshipLineType;
        head?: c4.RelationshipArrowType;
        tail?: c4.RelationshipArrowType;
    }>;
    colors: Record<c4.CustomColor, {
        color: c4.ColorLiteral;
    }>;
    deployments: Record<c4.DeploymentKind, c4.ElementSpecification>;
}
export interface ParsedAstElement {
    id: c4.Fqn;
    astPath: string;
    kind: c4.ElementKind;
    title?: string;
    summary?: c4.MarkdownOrString;
    description?: c4.MarkdownOrString;
    technology?: string;
    tags?: c4.NonEmptyArray<c4.Tag>;
    links?: c4.NonEmptyArray<c4.Link>;
    style: ParsedElementStyle;
    metadata?: {
        [key: string]: string | string[];
    };
}
export interface ParsedAstExtend {
    id: c4.Fqn;
    astPath: string;
    tags?: c4.NonEmptyArray<c4.Tag> | null;
    links?: c4.NonEmptyArray<c4.Link> | null;
    metadata?: {
        [key: string]: string | string[];
    };
}
export interface ParsedAstExtendRelation {
    id: c4.RelationId;
    astPath: string;
    tags?: c4.NonEmptyArray<c4.Tag> | null;
    links?: c4.NonEmptyArray<c4.Link> | null;
    metadata?: {
        [key: string]: string | string[];
    };
}
export interface ParsedAstRelation {
    id: c4.RelationId;
    astPath: string;
    source: c4.FqnRef.ModelRef;
    target: c4.FqnRef.ModelRef;
    kind?: c4.RelationshipKind;
    tags?: c4.NonEmptyArray<c4.Tag>;
    title: string;
    description?: c4.MarkdownOrString;
    technology?: string;
    color?: c4.Color;
    line?: c4.RelationshipLineType;
    head?: c4.RelationshipArrowType;
    tail?: c4.RelationshipArrowType;
    links?: c4.NonEmptyArray<c4.Link>;
    navigateTo?: c4.ViewId;
    metadata?: {
        [key: string]: string | string[];
    };
}
export type ParsedAstDeployment = Simplify<MergeExclusive<ParsedAstDeployment.Node, ParsedAstDeployment.Instance>>;
export declare namespace ParsedAstDeployment {
    type Node = c4.DeploymentNode;
    type Instance = Omit<c4.DeployedInstance, 'element'> & {
        readonly element: c4.FqnRef.ModelRef;
    };
}
export type ParsedAstDeploymentRelation = c4.DeploymentRelationship & {
    astPath: string;
};
export type ParsedAstGlobals = Writable<c4.ModelGlobals>;
export interface ParsedAstElementView {
    id: c4.ViewId;
    viewOf?: c4.Fqn;
    extends?: c4.ViewId;
    astPath: string;
    title: string | null;
    description: c4.MarkdownOrString | null;
    tags: c4.NonEmptyArray<c4.Tag> | null;
    links: c4.NonEmptyArray<c4.Link> | null;
    rules: c4.ElementViewRule[];
    manualLayout?: c4.ViewManualLayout;
}
export interface ParsedAstDynamicView {
    id: c4.ViewId;
    astPath: string;
    title: string | null;
    description: c4.MarkdownOrString | null;
    tags: c4.NonEmptyArray<c4.Tag> | null;
    links: c4.NonEmptyArray<c4.Link> | null;
    steps: c4.DynamicViewStep[];
    rules: Array<c4.DynamicViewRule>;
    variant: c4.DynamicViewDisplayVariant | undefined;
    manualLayout?: c4.ViewManualLayout;
}
export interface ParsedAstDeploymentView {
    id: c4.ViewId;
    astPath: string;
    title: string | null;
    description: c4.MarkdownOrString | null;
    tags: c4.NonEmptyArray<c4.Tag> | null;
    links: c4.NonEmptyArray<c4.Link> | null;
    rules: Array<c4.DeploymentViewRule>;
    manualLayout?: c4.ViewManualLayout;
}
export type ParsedAstView = ParsedAstElementView | ParsedAstDynamicView | ParsedAstDeploymentView;
export declare const ViewOps: {
    writeId<T extends ast.LikeC4View>(node: T, id: c4.ViewId): T;
    readId(node: ast.LikeC4View): c4.ViewId | undefined;
};
export declare const ElementOps: {
    writeId(node: ast.Element | ast.DeploymentElement, id: c4.Fqn | null): any;
    readId(node: ast.Element | ast.DeploymentElement): any;
};
export interface AstNodeDescriptionWithFqn extends AstNodeDescription {
    likec4ProjectId: c4.ProjectId;
    id: c4.Fqn;
}
export type LikeC4AstNode = ValueOf<ConditionalPick<ast.LikeC4AstType, AstNode>>;
type LikeC4DocumentDiagnostic = Diagnostic & DiagnosticInfo<LikeC4AstNode>;
export interface LikeC4DocumentProps {
    diagnostics?: Array<LikeC4DocumentDiagnostic>;
    c4Specification?: ParsedAstSpecification;
    c4Elements?: ParsedAstElement[];
    c4ExtendElements?: ParsedAstExtend[];
    c4ExtendDeployments?: ParsedAstExtend[];
    c4ExtendRelations?: ParsedAstExtendRelation[];
    c4Relations?: ParsedAstRelation[];
    c4Globals?: ParsedAstGlobals;
    c4Views?: ParsedAstView[];
    c4Deployments?: ParsedAstDeployment[];
    c4DeploymentRelations?: ParsedAstDeploymentRelation[];
    c4Imports?: MultiMap<c4.ProjectId, c4.Fqn, Set<c4.Fqn>>;
}
type LikeC4GrammarDocument = Omit<LangiumDocument<LikeC4Grammar>, 'diagnostics'>;
export interface LikeC4LangiumDocument extends LikeC4GrammarDocument, LikeC4DocumentProps {
    likec4ProjectId: c4.ProjectId;
}
export interface ParsedLikeC4LangiumDocument extends LikeC4GrammarDocument, Required<LikeC4DocumentProps> {
    likec4ProjectId: c4.ProjectId;
}
export declare function isLikeC4LangiumDocument(doc: LangiumDocument | undefined): doc is LikeC4LangiumDocument;
export declare function isParsedLikeC4LangiumDocument(doc: LangiumDocument): doc is ParsedLikeC4LangiumDocument;
export declare function parseMarkdownAsString(node?: ast.MarkdownOrString): string | undefined;
export declare function parseAstPercent(value: string): number;
export declare function parseAstOpacityProperty({ value }: ast.OpacityProperty): number;
export declare function parseAstSizeValue({ value }: {
    value: ast.SizeValue;
}): 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export declare function parseAstIconPositionValue({ value }: {
    value: ast.IconPositionValue;
}): c4.IconPosition;
export declare function toRelationshipStyle(props: ast.RelationshipStyleProperty[] | undefined, isValid: IsValidFn): {
    color?: c4.Color;
    line?: c4.RelationshipLineType;
    head?: c4.RelationshipArrowType;
    tail?: c4.RelationshipArrowType;
};
export declare function toColor(astNode: ast.ColorProperty | ast.IconColorProperty): c4.Color | undefined;
export declare function toAutoLayout(rule: ast.ViewRuleAutoLayout): c4.ViewRuleAutoLayout;
export declare function toAstViewLayoutDirection(c4: c4.ViewRuleAutoLayout['direction']): ast.ViewLayoutDirection;
export declare function getViewRulePredicateContainer<T extends AstNode>(el: T): ast.ViewRulePredicate | ast.DeploymentViewRulePredicate | ast.DynamicViewIncludePredicate | undefined;
export declare function isFqnRefInsideGlobals(astNode: AstNode): boolean;
export declare function isFqnRefInsideModel(astNode: AstNode): boolean;
export declare function isFqnRefInsideDeployment(astNode: AstNode): boolean;
