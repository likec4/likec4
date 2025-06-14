import { type CstNode, type ValueType, DefaultValueConverter } from 'langium'

export class LikeC4ValueConverter extends DefaultValueConverter {
  protected override runConverter(rule: any, input: string, cstNode: CstNode): ValueType {
    if (rule.name.toUpperCase() === 'STRING') {
      if ((input.startsWith('"""') && input.endsWith('"""')) || (input.startsWith(`'''`) && input.endsWith(`'''`))) {
        input = input.slice(3, -3)
      }
    }
    return super.runConverter(rule, input, cstNode)
  }
}
