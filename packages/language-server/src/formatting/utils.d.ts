import type { CstNode } from 'langium';
import type { Position, Range } from 'vscode-languageserver-types';
export declare function areOverlap(a: CstNode, b: CstNode): boolean;
export declare function compareRanges(a: CstNode, b: CstNode): number;
export declare function isInRagne(range: Range, pos: Position): boolean;
export declare function isMultiline(node: CstNode | undefined): boolean;
