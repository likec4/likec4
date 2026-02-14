import type * as c4 from '@likec4/core';
import { ast } from '../ast';
export declare function parseWhereClause(astNode: ast.WhereExpression): c4.WhereOperator;
export declare function createBinaryOperator(operator: Lowercase<ast.WhereBinaryExpression['operator']>, left: c4.WhereOperator, right: c4.WhereOperator | null): c4.WhereOperator;
