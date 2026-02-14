import { type DeploymentFqn, type Fqn, type NonEmptyArray, type ViewChange } from '@likec4/core';
import { type Range, TextEdit } from 'vscode-languageserver-types';
import { type ParsedAstView, type ParsedLikeC4LangiumDocument, ast } from '../ast';
import type { LikeC4Services } from '../module';
type ChangeElementStyleArg = {
    view: ParsedAstView;
    doc: ParsedLikeC4LangiumDocument;
    viewAst: ast.LikeC4View;
    targets: NonEmptyArray<Fqn | DeploymentFqn>;
    style: ViewChange.ChangeElementStyle['style'];
};
export declare function changeElementStyle(services: LikeC4Services, { view, viewAst, targets, style, }: ChangeElementStyleArg): {
    modifiedRange: Range;
    edits: TextEdit[];
};
export {};
