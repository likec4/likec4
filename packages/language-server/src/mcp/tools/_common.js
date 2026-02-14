import { URI } from 'vscode-uri';
import * as z from 'zod/v3';
import { ProjectsManager } from '../../workspace';
import { logger } from '../utils';
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
}).nullable();
export const projectIdSchema = z.string()
    .refine((_v) => true)
    .optional()
    .default(ProjectsManager.DefaultProjectId)
    .describe('Project id (optional, will use "default" if not specified)');
export const includedInViewsSchema = z.array(z.object({
    id: z.string().describe('View id'),
    title: z.string().describe('View title'),
    type: z.enum(['element', 'deployment', 'dynamic']).describe('View type'),
}));
export const includedInViews = (views) => {
    return [...views].map(v => ({
        id: v.id,
        title: v.titleOrId,
        type: v.$view._type,
    }));
};
export const mkLocate = (languageServices, projectId) => (params) => {
    try {
        const loc = languageServices.locate({ projectId, ...params });
        return loc
            ? {
                path: URI.parse(loc.uri).fsPath,
                range: loc.range,
            }
            : null;
    }
    catch (e) {
        logger.debug(`Failed to locate {params}`, { error: e, params });
        return null;
    }
};
