import { modelConnection } from '@likec4/core/model';
import { invariant, isSameHierarchy } from '@likec4/core/utils';
import * as z from 'zod/v3';
import { likec4Tool } from '../utils';
import { includedInViews, includedInViewsSchema, locationSchema, mkLocate, projectIdSchema } from './_common';
const endpointSchema = z.object({
    id: z.string(),
    title: z.string(),
    kind: z.string(),
});
const searchResultSchema = z.object({
    type: z.enum(['direct', 'indirect']).describe('Type of relationship, "direct" for direct relationships, "indirect" for relationships through nested elements'),
    source: endpointSchema,
    target: endpointSchema,
    kind: z.string().nullable().describe('Relationship kind'),
    title: z.string().nullable().describe('Relationship title'),
    description: z.string().nullable().describe('Relationship description'),
    technology: z.string().nullable().describe('Relationship technology'),
    tags: z.array(z.string()).describe('Relationship tags'),
    includedInViews: includedInViewsSchema.describe('Views that include this relationship'),
    sourceLocation: locationSchema,
});
export const findRelationships = likec4Tool({
    name: 'find-relationships',
    annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        title: 'Find relationships between two elements',
    },
    description: `
Find relationships between two LikeC4 elements within a project.

What it does:
- Finds both direct relationships (element1 ↔ element2) and indirect ones that arise via containment (e.g. via nested elements).
- Returns rich metadata for each relationship and where it appears in views.

Inputs:
- element1: string — Element ID (FQN)
- element2: string — Element ID (FQN)
- project: string (optional, defaults to "default") — Project id

Output:
- found: Relationship[]

Relationship (object) fields:
- type: "direct" | "indirect" — direct is between the specified endpoints; indirect is via nested elements
- source: Endpoint
- target: Endpoint
- kind: string|null — relationship kind from the model
- title: string|null — relationship title if provided
- description: string|null — relationship description text
- technology: string|null — relationship technology
- tags: string[] — relationship tags
- includedInViews: View[] — views where this relationship appears
- sourceLocation: { path: string, range: { start: { line: number, character: number }, end: { line: number, character: number } } } | null

Endpoint (object) fields:
- id: string — Element ID (FQN)
- title: string — element title
- kind: string — element kind

View (object) fields:
- id: string — view identifier
- title: string — view title
- type: "element" | "deployment" | "dynamic"

Notes:
- Read-only, idempotent; does not mutate the model. May trigger UI navigation in supporting clients.
- The order of results is not guaranteed.

Example:
Request:
{
  "element1": "shop.frontend",
  "element2": "shop.backend",
  "project": "default"
}

Response:
{
  "found": [
    {
      "type": "direct",
      "source": { "id": "shop.frontend", "title": "Frontend", "kind": "component" },
      "target": { "id": "shop.backend", "title": "Backend", "kind": "component" },
      "kind": "sync",
      "title": "Calls",
      "description": "Frontend calls Backend",
      "technology": "HTTP",
      "tags": ["public"],
      "includedInViews": [
        { "id": "system-overview", "title": "System Overview", "type": "element" }
      ],
      "sourceLocation": {
        "path": "/abs/path/project/model.c4",
        "range": { "start": { "line": 12, "character": 0 }, "end": { "line": 14, "character": 0 } }
      }
    }
  ]
}
`,
    inputSchema: {
        element1: z.string().describe('Element ID (FQN)'),
        element2: z.string().describe('Element ID (FQN)'),
        project: projectIdSchema,
    },
    outputSchema: {
        found: z.array(searchResultSchema),
    },
}, async (languageServices, args) => {
    const projectId = languageServices.projectsManager.ensureProjectId(args.project);
    if (isSameHierarchy(args.element1, args.element2)) {
        throw new Error('No relationships possible between parent-child');
    }
    const found = [];
    const model = await languageServices.computedModel(projectId);
    const el1 = model.findElement(args.element1);
    invariant(el1, `Element "${args.element1}" not found in project "${projectId}"`);
    const el2 = model.findElement(args.element2);
    invariant(el2, `Element "${args.element2}" not found in project "${projectId}"`);
    const locate = mkLocate(languageServices, projectId);
    const relationships = modelConnection.findConnection(el1, el2, 'both').flatMap(c => [...c.relations]);
    for (const relationship of relationships) {
        const isDirect = (relationship.source === el1 && relationship.target === el2)
            || (relationship.source === el2 && relationship.target === el1);
        found.push({
            type: isDirect ? 'direct' : 'indirect',
            source: {
                id: relationship.source.id,
                title: relationship.source.title,
                kind: relationship.source.kind,
            },
            target: {
                id: relationship.target.id,
                title: relationship.target.title,
                kind: relationship.target.kind,
            },
            kind: relationship.kind,
            title: relationship.title,
            description: relationship.description.text,
            technology: relationship.technology,
            tags: [...relationship.tags],
            includedInViews: includedInViews(relationship.views()),
            sourceLocation: locate({ relation: relationship.id }),
        });
    }
    return {
        found,
    };
});
