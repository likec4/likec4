/**
 * Path to the folder of a dependency project (the folder with its LikeC4 config),
 * relative to the folder of the consumer project (no leading slash, drive letter, or protocol).
 *
 * @example '../shared-model'
 */
export type DependencyPath = string

/**
 * The `dependencies` section of the project config.
 * Maps the import name (used in `import ... from 'name'`) to the dependency location.
 *
 * The import name follows the project name rules: it cannot contain ".", "@" or "#".
 *
 * @example
 * ```json
 * {
 *   "name": "my-project",
 *   "dependencies": {
 *     "shared": "../shared-model"
 *   }
 * }
 * ```
 */
export type DependenciesConfig = Record<string, DependencyPath>
