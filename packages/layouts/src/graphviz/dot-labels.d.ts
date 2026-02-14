import { type ComputedEdge, type ComputedNode, LikeC4Styles } from '@likec4/core';
export declare function sanitize(text: string): string;
type WrapOptions = {
    maxchars: number;
    maxLines?: number | undefined;
    sanitize?: ((v: string) => string) | undefined;
};
export declare function wrap(text: string, { maxchars, maxLines, sanitize: escape, }: WrapOptions): string[];
/**
 * "Faking" a node icon with a blue square
 * to preserve space for real icons.
 * #112233
 */
export declare function nodeIcon(): string;
/**
 * Returns a formatted string for the given node, using the provided styles.
 * The output string is a HTML table containing the node's title, technology, and description.
 * If the node has an icon, the table will have a left padding of 60px (icon size) plus 10px (node margin).
 * If the node's shape is 'queue' or 'mobile', an additional 20px of padding is added.
 * The table will have a single row if the node has no icon and only one line of text.
 * @param {ComputedNode} node - The node to format.
 * @param {LikeC4Styles} styles - The styles to use for formatting.
 * @returns {string} A formatted string for the given node.
 */
export declare function nodeLabel(node: ComputedNode, styles: LikeC4Styles): string;
export declare function compoundLabel(node: ComputedNode, color?: string): string;
export declare const EDGE_LABEL_MAX_CHARS = 40;
export declare const EDGE_LABEL_MAX_LINES = 5;
export declare function edgelabel({ label, technology }: ComputedEdge): string;
export declare function stepEdgeLabel(step: number, text?: string | null): string;
export {};
