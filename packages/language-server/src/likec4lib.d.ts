import type { URI } from 'vscode-uri';
import { LibIcons } from './generated-lib/icons';
export declare const Scheme = "likec4builtin";
export declare const Uri: "likec4builtin:///likec4/lib/icons.c4";
export { LibIcons as Content };
export declare function isLikeC4Builtin(uri: URI | {
    uri: URI;
}): boolean;
export declare function isNotLikeC4Builtin(uri: URI | {
    uri: URI;
}): boolean;
