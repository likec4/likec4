import type { AstNode, ValidationCheck } from 'langium';
export declare const RESERVED_WORDS: string[];
export declare function tryOrLog<T extends AstNode>(fn: ValidationCheck<T>): ValidationCheck<T>;
