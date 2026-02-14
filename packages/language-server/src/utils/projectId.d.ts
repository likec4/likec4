import { type ProjectId } from '@likec4/core';
import { type AstNode, type LangiumDocument } from 'langium';
import { ast } from '../ast';
export declare function projectIdFrom(value: AstNode | LangiumDocument | ast.ImportsFromPoject | ast.Imported): ProjectId;
