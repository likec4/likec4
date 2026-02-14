import type { Tagged } from 'type-fest';
export type ProjectId<T = string> = Tagged<T, 'ProjectID'>;
export declare function ProjectId(name: string): ProjectId;
export type MarkdownOrString = {
    txt: string;
    md?: never;
} | {
    md: string;
    txt?: never;
};
export declare function MarkdownOrString(value: {
    txt: string;
    md?: never;
} | {
    md: string;
    txt?: never;
} | string): MarkdownOrString;
/**
 * Converts a MarkdownOrString object or a plain string into a simple string representation.
 * This utility function handles different types of text content and normalizes them to a string format.
 *
 * @param value - The content to be flattened.
 *   Can be one of:
 *   - A plain string
 *   - A MarkdownOrString object with either txt or md property
 *   - undefined or null
 *
 * @returns The string content contained within the input value.
 *   - Returns the input directly if it's already a string
 *   - Returns the txt property if available in a MarkdownOrString object
 *   - Falls back to the md property if txt is not available
 *   - Returns null if:
 *     - The input is null or undefined
 *     - The resulting string value is empty, whitespace, or null
 *
 * @example
 * // String input
 * flattenMarkdownOrString("Hello world") // Returns: "Hello world"
 * flattenMarkdownOrString("   ") // Returns: null
 *
 * // MarkdownOrString with txt property
 * flattenMarkdownOrString({ txt: "Plain text" }) // Returns: "Plain text"
 * flattenMarkdownOrString({ txt: "   " }) // Returns: null
 *
 * // MarkdownOrString with md property
 * flattenMarkdownOrString({ md: "**Bold markdown**" }) // Returns: "**Bold markdown**"
 *
 * // Null input
 * flattenMarkdownOrString(null) // Returns: null
 */
export declare function flattenMarkdownOrString(value: MarkdownOrString | string): string;
export declare function flattenMarkdownOrString(value: MarkdownOrString | string | undefined | null): string | null;
export type BuiltInIcon = 'none' | `${'aws' | 'azure' | 'gcp' | 'tech' | 'bootstrap'}:${string}`;
export type Icon = Tagged<string, 'Icon'> | BuiltInIcon;
export declare const NoneIcon: Icon;
export type IconUrl = Icon;
/**
 * Full-qualified-name for model elements
 */
export type Fqn<Id = string> = Tagged<Id, 'Fqn'>;
export declare function Fqn(name: string, parent?: Fqn | null): Fqn;
export type ElementKind<Kinds = string> = Tagged<Kinds, 'ElementKind'>;
export declare const GroupElementKind: ElementKind<"@group">;
export type GroupElementKind = typeof GroupElementKind;
export declare function isGroupElementKind<V extends {
    kind?: any;
}>(v: V): v is V & {
    kind: GroupElementKind;
};
/**
 * Full-qualified-name for deployment elements
 */
export type DeploymentFqn<T = string> = Tagged<T, 'DeploymentFqn'>;
export declare function DeploymentFqn(name: string, parent?: DeploymentFqn | null): DeploymentFqn;
export type DeploymentKind<Kinds = string> = Tagged<Kinds, 'DeploymentKind'>;
export type ViewId<Id = string> = Tagged<Id, 'ViewId'>;
export declare function ViewId(id: string): ViewId;
export type AnyFqn<T = string> = DeploymentFqn<T> | Fqn<T>;
/**
 * @deprecated Use {@link RelationshipKind} instead
 */
export type RelationKind<Kinds = string> = RelationshipKind<Kinds>;
export type RelationshipKind<Kinds = string> = Tagged<Kinds, 'RelationshipKind'>;
export type RelationId<Id = string> = Tagged<Id, 'RelationId'>;
export declare function RelationId(id: string): RelationId;
export type Tag<T = string> = Tagged<T, 'Tag'>;
export type GlobalFqn<Id = string> = Tagged<Fqn<Id>, 'GlobalFqn'>;
export declare function GlobalFqn<A>(projectId: A | ProjectId<A>, name: string): GlobalFqn<A>;
export declare function isGlobalFqn<A extends string>(fqn: A): fqn is GlobalFqn<A>;
export declare function splitGlobalFqn<I extends string>(fqn: Fqn<I> | GlobalFqn<I>): [ProjectId | null, Fqn<I>];
export type NodeId = Tagged<string, 'NodeId' | 'Fqn' | 'DeploymentFqn'>;
export declare function NodeId(id: string): NodeId;
export type EdgeId = Tagged<string, 'EdgeId'>;
export declare function EdgeId(id: string): EdgeId;
export type StepEdgeIdLiteral = `step-${number}` | `step-${number}.${number}`;
export type StepEdgeId = Tagged<StepEdgeIdLiteral, 'EdgeId'>;
export declare function stepEdgeId(step: number, parallelStep?: number): StepEdgeId;
export declare const StepEdgeKind = "@step";
export declare function isStepEdgeId(id: string): id is StepEdgeId;
export declare function extractStep(id: EdgeId): number;
