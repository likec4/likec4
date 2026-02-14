import { type GuardedBy } from '@likec4/core/types';
import { type LikeC4LangiumDocument } from '../ast';
import type { LikeC4Services } from '../module';
export { LikeC4DocumentValidator } from './DocumentValidator';
declare const isValidatableAstNode: any;
type ValidatableAstNode = GuardedBy<typeof isValidatableAstNode>;
export declare function checksFromDiagnostics(doc: LikeC4LangiumDocument): {
    isValid: (n: ValidatableAstNode) => boolean;
    invalidNodes: WeakSet<WeakKey>;
};
export type ChecksFromDiagnostics = ReturnType<typeof checksFromDiagnostics>;
export type IsValidFn = ChecksFromDiagnostics['isValid'];
export declare function registerValidationChecks(services: LikeC4Services): void;
