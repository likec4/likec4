/** Trim trailing slashes and backslashes (no regex, avoids S5852 ReDoS). */
function trimTrailingSlashes(s) {
    let end = s.length;
    while (end > 0 && (s[end - 1] === '/' || s[end - 1] === '\\'))
        end--;
    return s.slice(0, end);
}
/** Split by / or \ without regex (avoids S5852 ReDoS). */
function splitPath(s) {
    return s.split('/').flatMap(part => part.split('\\'));
}
/** basename compatible with Node and browser (no node:path for Vite/playground bundle). */
function basename(path) {
    const trimmed = trimTrailingSlashes(path);
    const segments = splitPath(trimmed);
    const last = segments[segments.length - 1];
    return last || trimmed;
}
export const configJsonFilenames = [
    '.likec4rc',
    '.likec4.config.json',
    'likec4.config.json',
];
export const configNonJsonFilenames = [
    'likec4.config.js',
    'likec4.config.cjs',
    'likec4.config.mjs',
    'likec4.config.ts',
    'likec4.config.cts',
    'likec4.config.mts',
];
export const ConfigFilenames = [
    ...configJsonFilenames,
    ...configNonJsonFilenames,
];
/**
 * Checks if the given filename is a LikeC4 JSON config file (JSON, RC).
 */
export function isLikeC4JsonConfig(filename) {
    return configJsonFilenames.includes(basename(filename));
}
/**
 * Checks if the given filename is a LikeC4 non-JSON config file (JS, MJS, TS, MTS)
 */
export function isLikeC4NonJsonConfig(filename) {
    return configNonJsonFilenames.includes(basename(filename));
}
/**
 * Checks if the given filename is a LikeC4 config file (JSON or non-JSON)
 */
export function isLikeC4Config(filename) {
    return isLikeC4JsonConfig(filename) || isLikeC4NonJsonConfig(filename);
}
