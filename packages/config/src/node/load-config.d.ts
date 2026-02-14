import type { LikeC4ProjectConfig, VscodeURI } from '../schema';
/**
 * Load LikeC4 Project config file.
 * If filepath is a non-JSON file, it will be bundled and required
 */
export declare function loadConfig(filepath: VscodeURI | string): Promise<LikeC4ProjectConfig>;
