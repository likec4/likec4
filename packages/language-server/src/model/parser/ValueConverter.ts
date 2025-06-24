import { type CstNode, type ValueType, DefaultValueConverter, ValueConverter } from 'langium'

export class LikeC4ValueConverter extends DefaultValueConverter {
  protected override runConverter(rule: any, input: string, cstNode: CstNode): ValueType {
    if (rule.name === 'MarkdownString') {
      if ((input.startsWith('"""') && input.endsWith('"""')) || (input.startsWith(`'''`) && input.endsWith(`'''`))) {
        input = input.slice(3, -3)
      }
      return ValueConverter.convertString(input)
    }
    return super.runConverter(rule, input, cstNode)
  }
}
