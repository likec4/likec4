import type { LikeC4ViewModel } from '@likec4/core/model'
import type { ProjectId } from '@likec4/core/types'
import { URI } from 'vscode-uri'
import z from 'zod'
import type { LikeC4LanguageServices } from '../../LikeC4LanguageServices'
import type { Locate } from '../../protocol'
import { ProjectsManager } from '../../workspace'
import { logger } from '../utils'

export const locationSchema = z.object({
  path: z.string().describe('Path to the file'),
  range: z.object({
    start: z.object({
      line: z.number(),
      character: z.number(),
    }),
    end: z.object({
      line: z.number(),
      character: z.number(),
    }),
  }).describe('Range in the file'),
}).nullable()

export const projectIdSchema = z.string()
  .refine((v): v is ProjectId => true)
  .optional()
  .default(ProjectsManager.DefaultProjectId)
  .describe('Project id (optional, will use "default" if not specified)')

export const includedInViewsSchema = z.array(z.object({
  id: z.string().describe('View id'),
  title: z.string().describe('View title'),
  type: z.enum(['element', 'deployment', 'dynamic']).describe('View type'),
}))

export const includedInViews = (views: Iterable<LikeC4ViewModel>): z.infer<typeof includedInViewsSchema> => {
  return [...views].map(v => ({
    id: v.id,
    title: v.titleOrId,
    type: v.$view._type,
  }))
}

export const mkLocate = (
  languageServices: LikeC4LanguageServices,
  projectId: string,
) =>
(params: Locate.Params): z.infer<typeof locationSchema> => {
  try {
    const loc = languageServices.locate({ projectId, ...params })
    return loc
      ? {
        path: URI.parse(loc.uri).fsPath,
        range: loc.range,
      }
      : null
  } catch (e) {
    logger.debug(`Failed to locate ${params}`, { error: e })
    return null
  }
}
