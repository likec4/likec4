import { type c4, invariant, isNonEmptyArray, nonexhaustive } from '@likec4/core'
import { isAndOperator, isOrOperator } from '@likec4/core'
import { ast } from '../ast'

const parseEquals = (
  { operator, not }: ast.WhereKindEqual | ast.WhereTagEqual,
  value: string
): c4.EqualOperator<string> => {
  if (operator.startsWith('!=')) {
    return {
      neq: value
    }
  }
  if (operator.startsWith('=')) {
    return {
      eq: value
    }
  }
  return not ? { neq: value } : { eq: value }
}

export function parseWhereClause(astNode: ast.WhereExpression): c4.WhereOperator<string, string> {
  switch (true) {
    case ast.isWhereTagEqual(astNode): {
      const tag = astNode.value?.ref?.name
      invariant(tag, 'Expected tag name')
      return {
        tag: parseEquals(astNode, tag)
      }
    }
    case ast.isWhereKindEqual(astNode): {
      const kind = astNode.value?.ref?.name
      invariant(kind, 'Expected kind name')
      return {
        kind: parseEquals(astNode, kind)
      }
    }
    case ast.isWhereElementNegation(astNode) || ast.isWhereRelationNegation(astNode): {
      return {
        not: parseWhereClause(astNode.value)
      }
    }
    case ast.isWhereBinaryExpression(astNode): {
      const left = parseWhereClause(astNode.left)
      const right = parseWhereClause(astNode.right)
      const operator = astNode.operator.toLowerCase() as Lowercase<ast.WhereBinaryExpression['operator']>
      switch (operator) {
        case 'and': {
          const operands = [
            isAndOperator(left) ? left.and : left,
            isAndOperator(right) ? right.and : right
          ].flat()
          invariant(isNonEmptyArray(operands), 'Expected non-empty array')
          return {
            and: operands
          }
        }
        case 'or': {
          const operands = [
            isOrOperator(left) ? left.or : left,
            isOrOperator(right) ? right.or : right
          ].flat()
          invariant(isNonEmptyArray(operands), 'Expected non-empty array')
          return {
            or: operands
          }
        }
        default:
          nonexhaustive(operator)
      }
    }
    default:
      nonexhaustive(astNode)
  }
}
