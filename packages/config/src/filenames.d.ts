export declare const configJsonFilenames: readonly [".likec4rc", ".likec4.config.json", "likec4.config.json"];
export declare const configNonJsonFilenames: readonly ["likec4.config.js", "likec4.config.cjs", "likec4.config.mjs", "likec4.config.ts", "likec4.config.cts", "likec4.config.mts"];
export declare const ConfigFilenames: readonly [".likec4rc", ".likec4.config.json", "likec4.config.json", "likec4.config.js", "likec4.config.cjs", "likec4.config.mjs", "likec4.config.ts", "likec4.config.cts", "likec4.config.mts"];
/**
 * Returns true when the basename of the given path is a LikeC4 JSON config filename (JSON, RC).
 */
export declare function isLikeC4JsonConfig(filename: string): boolean;
/**
 * Returns true when the basename of the given path is a LikeC4 non-JSON config filename (JS, CJS, MJS, TS, CTS, MTS).
 */
export declare function isLikeC4NonJsonConfig(filename: string): boolean;
/**
 * Returns true when the basename of the given path is any known LikeC4 config filename (JSON or non-JSON).
 */
export declare function isLikeC4Config(filename: string): boolean;
