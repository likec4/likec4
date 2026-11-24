import { type CstNode, type ValueType, AstUtils, DefaultValueConverter, GrammarAST, ValueConverter } from 'langium'

export class LikeC4ValueConverter extends DefaultValueConverter {
  protected override runConverter(rule: any, input: string, cstNode: CstNode): ValueType {
    if (rule.name === 'MarkdownString') {
      if ((input.startsWith('"""') && input.endsWith('"""')) || (input.startsWith(`'''`) && input.endsWith(`'''`))) {
        input = input.slice(2, -2)
      }
      return ValueConverter.convertString(input)
    }
    // Digits-only HEX colors (e.g. `#000000`) are matched by the `Number` terminal,
    // keep them as text so leading zeros are not lost
    if (rule.name === 'Number' && isHexColorValue(cstNode)) {
      return input
    }
    return super.runConverter(rule, input, cstNode)
  }
}

function isHexColorValue(cstNode: CstNode): boolean {
  const assignment = AstUtils.getContainerOfType(cstNode.grammarSource, GrammarAST.isAssignment)
  return assignment?.feature === 'hex'
    && AstUtils.getContainerOfType(assignment, GrammarAST.isParserRule)?.name === 'HexColor'
}
