import type { BridgeModelInput } from './model-input'

/** Minimal in-memory model for tests */
export function createFixtureModel(overrides: Partial<{
  projectId: string
  elements: Array<{ id: string; kind: string; title: string; tags?: string[]; technology?: string | null; metadata?: Record<string, unknown> }>
  relations: Array<{ id: string; source: string; target: string; kind?: string | null; title?: string | null }>
  views: Array<{ id: string }>
}> = {}): BridgeModelInput {
  const projectId = overrides.projectId ?? 'test-project'
  const elements = overrides.elements ?? [
    { id: 'cloud', kind: 'system', title: 'Cloud', tags: [], getMetadata: () => ({}) },
    { id: 'cloud.backend', kind: 'container', title: 'Backend', tags: [], getMetadata: () => ({}) },
    { id: 'cloud.backend.api', kind: 'component', title: 'API', tags: ['core'], technology: 'Node', getMetadata: () => ({}) },
  ]
  const relations = overrides.relations ?? [
    { id: 'r1', source: 'cloud', target: 'cloud.backend', kind: 'contains', title: null },
    { id: 'r2', source: 'cloud.backend', target: 'cloud.backend.api', kind: 'contains', title: null },
  ]
  const views = overrides.views ?? [{ id: 'index' }, { id: 'landscape' }]

  return {
    projectId,
    elements: () => elements.map(e => ({
      id: e.id,
      kind: e.kind,
      title: e.title,
      tags: e.tags ?? [],
      technology: e.technology ?? null,
      getMetadata: () => e.metadata ?? {},
    })),
    relationships: () => relations.map(r => ({
      id: r.id,
      source: { id: r.source },
      target: { id: r.target },
      kind: r.kind ?? null,
      title: r.title ?? null,
    })),
    views: () => views.map(v => ({ id: v.id })),
  }
}
