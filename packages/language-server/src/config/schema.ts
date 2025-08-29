import JSON5 from 'json5'
import * as v from 'valibot'
import { ImageAliasesSchema, validateImageAliases } from './imageAliasSchema'

export const ProjectConfig = v.object({
  name: v.pipe(
    v.string(),
    v.nonEmpty('Project name cannot be empty'),
    v.excludes('default', 'Project name cannot be "default"'),
    v.excludes('.', 'Project name cannot contain ".", try to use A-z, 0-9, _ and -'),
    v.excludes('@', 'Project name cannot contain "@", try to use A-z, 0-9, _ and -'),
    v.excludes('#', 'Project name cannot contain "#", try to use A-z, 0-9, _ and -'),
    v.description('Project name, must be unique in the workspace'),
  ),
  title: v.optional(
    v.pipe(
      v.string(),
      v.nonEmpty('Project title cannot be empty if specified'),
      v.description('A human readable title for the project'),
    ),
  ),
  contactPerson: v.optional(
    v.pipe(
      v.string(),
      v.nonEmpty('Contact person cannot be empty if specified'),
      v.description(
        'A person who has been involved in creating or maintaining this project',
      ),
    ),
  ),
  exclude: v.optional(
    v.pipe(
      v.array(v.string()),
      v.description(
        'List of file patterns to exclude from the project, default is ["**/node_modules/**"]',
      ),
    ),
  ),
  imageAliases: v.optional(ImageAliasesSchema),
})

export type ProjectConfig = v.InferOutput<typeof ProjectConfig>

export function parseConfigJson(config: string): ProjectConfig {
  return validateConfig(JSON5.parse(config))
}

export function validateConfig(config: unknown): ProjectConfig {
  const parsed = v.parse(ProjectConfig, config)

  // Applies additional validation to the `imageAliases` field,
  // as volibot doesn't support exporting the full schema types
  // to a JSON Schema file.
  validateImageAliases(parsed.imageAliases)

  return parsed
}
