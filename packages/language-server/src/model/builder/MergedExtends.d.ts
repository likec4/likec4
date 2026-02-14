import type * as c4 from '@likec4/core';
import type { ParsedAstExtend } from '../../ast';
export declare class MergedExtends {
    private mergedData;
    private mergeMetadata;
    merge(parsedExtends: ParsedAstExtend[]): void;
    applyExtended<E extends {
        id: string;
        tags?: readonly string[] | null;
        links?: readonly c4.Link[] | null;
        metadata?: Record<string, string | string[]>;
    }>(el: E): E;
}
