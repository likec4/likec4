import { invariant, isNonEmptyArray, nonexhaustive } from '@likec4/core'
import { isAndOperator, isOrOperator } from '@likec4/core'
import type * as c4 from '@likec4/core'
import { ast } from '../ast'

const parseEquals = (
  { operator, not }: ast.WhereKindEqual | ast.WhereTagEqual,
  value: string,
): c4.EqualOperator<string> => {
  if (operator.startsWith('!=')) {
    return {
      neq: value,
    }
  }
  if (operator.startsWith('=')) {
    return {
      eq: value,
    }
  }
  return not ? { neq: value } : { eq: value }
}

function parseParticipant(astNode: ast.WhereExpression): ast.Participant | null {
  if (!ast.isWhereRelationParticipantKind(astNode) && !ast.isWhereRelationParticipantTag(astNode)) {
    return null
  }

  return astNode.participant
}

export function parseWhereClause(astNode: ast.WhereExpression): c4.WhereOperator<string, string> {
  switch (true) {
    case ast.isWhereTagEqual(astNode): {
      const tag = astNode.value?.ref?.name
      const participant = parseParticipant(astNode)
      invariant(tag, 'Expected tag name')
      const tagOperator = { tag: parseEquals(astNode, tag) }
      return participant ? { participant, operator: tagOperator } : tagOperator
    }
    case ast.isWhereKindEqual(astNode): {
      const kind = astNode.value?.ref?.name
      const participant = parseParticipant(astNode)
      invariant(kind, 'Expected kind name')
      const kindOperator = { kind: parseEquals(astNode, kind) }
      return participant ? { participant, operator: kindOperator } : kindOperator
    }
    case ast.isWhereElementNegation(astNode) || ast.isWhereRelationNegation(astNode): {
      return {
        not: parseWhereClause(astNode.value),
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
            isAndOperator(right) ? right.and : right,
          ].flat()
          invariant(isNonEmptyArray(operands), 'Expected non-empty array')
          return {
            and: operands,
          }
        }
        case 'or': {
          const operands = [
            isOrOperator(left) ? left.or : left,
            isOrOperator(right) ? right.or : right,
          ].flat()
          invariant(isNonEmptyArray(operands), 'Expected non-empty array')
          return {
            or: operands,
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
