import { type CstNode, type ValueType, DefaultValueConverter } from 'langium';
export declare class LikeC4ValueConverter extends DefaultValueConverter {
    protected runConverter(rule: any, input: string, cstNode: CstNode): ValueType;
}
