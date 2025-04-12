import JSON5 from 'json5'
import * as v from 'valibot'

const nonEmptyString = v.pipe(v.string(), v.nonEmpty())

export const ProjectConfig = v.object({
  name: v.pipe(
    nonEmptyString,
    // TODO: check if this is needed
    // v.excludes('.', 'Project name cannot contain "."'),
    v.description('Project name, must be unique in the workspace'),
  ),
  contactPerson: v.optional(
    v.pipe(
      nonEmptyString,
      v.description('A person who has been involved in creating or maintaining this project'),
    ),
  ),
  // imports: v.optional(
  //   v.pipe(
  //     v.record(v.string(), nonEmptyString),
  //     v.description('Imported projects'),
  //   ),
  // ),
  exclude: v.optional(
    v.pipe(
      v.array(v.string()),
      v.description('List of file patterns to exclude from the project, default is ["**/node_modules/**/*"]'),
    ),
  ),
})

export type ProjectConfig = v.InferOutput<typeof ProjectConfig>

export function parseConfigJson(config: string): ProjectConfig {
  return validateConfig(JSON5.parse(config))
}

export function validateConfig(config: unknown): ProjectConfig {
  return v.parse(ProjectConfig, config)
}
