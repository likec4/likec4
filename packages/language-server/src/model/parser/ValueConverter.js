import { DefaultValueConverter, ValueConverter } from 'langium';
export class LikeC4ValueConverter extends DefaultValueConverter {
    runConverter(rule, input, cstNode) {
        if (rule.name === 'MarkdownString') {
            if ((input.startsWith('"""') && input.endsWith('"""')) || (input.startsWith(`'''`) && input.endsWith(`'''`))) {
                input = input.slice(2, -2);
            }
            return ValueConverter.convertString(input);
        }
        return super.runConverter(rule, input, cstNode);
    }
}
