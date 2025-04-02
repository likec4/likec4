import JSON5 from 'json5'
import type { Simplify } from 'type-fest'
import * as v from 'valibot'

export const ProjectConfig = v.object({
  name: v.pipe(
    v.string(),
    v.nonEmpty(),
    v.description('Project name, must be unique in the workspace'),
  ),
  contactPerson: v.optional(
    v.pipe(
      v.string(),
      v.nonEmpty(),
      v.description('A person who has been involved in creating or maintaining this project'),
    ),
  ),
  exclude: v.optional(
    v.pipe(
      v.array(v.string()),
      v.description('List of file patterns to exclude from the project, default is ["/node_modules/"]'),
    ),
  ),
})

export type ProjectConfig = Simplify<
  v.InferOutput<typeof ProjectConfig> & {
    exclude: string[]
  }
>

export function parseConfigJson(config: string): ProjectConfig {
  return validateConfig(JSON5.parse(config))
}

export function validateConfig(config: unknown): ProjectConfig {
  const parsed = v.parse(ProjectConfig, config)
  return {
    ...parsed,
    exclude: parsed.exclude ?? ['/node_modules/'],
  }
}
