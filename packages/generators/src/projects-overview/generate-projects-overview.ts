import type { LayoutedProjectsView } from '@likec4/core/compute-view'
import { type LikeC4ViewModel, LikeC4Model } from '@likec4/core/model'
import type { aux, LayoutedElementView, LayoutedLikeC4ModelData, scalar } from '@likec4/core/types'
import { generateD2 } from '../d2/generate-d2'
import { generateDrawio, generateDrawioEditUrl } from '../drawio/generate-drawio'
import { generateMermaid } from '../mmd/generate-mmd'
import { generatePuml } from '../puml/generate-puml'

const OVERVIEW_ID = 'projects-overview'
const PROJECT_KIND = 'project'

export interface ProjectsOverviewTextSources {
  readonly d2: string
  readonly mmd: string
  readonly puml: string
  readonly drawioEditUrl: string
}

/**
 * Wraps a layouted projects overview into a throwaway model with one element view,
 * so the view generators can render it unchanged.
 */
function toViewModel(overview: LayoutedProjectsView): LikeC4ViewModel<aux.Unknown> {
  const view: LayoutedElementView = {
    ...overview,
    _type: 'element',
    id: OVERVIEW_ID as scalar.ViewId,
    title: overview.title ?? 'Projects overview',
    autoLayout: { direction: 'TB' },
    hash: OVERVIEW_ID,
    nodes: overview.nodes.map(node => ({
      ...node,
      kind: node.kind === '@group' ? node.kind : PROJECT_KIND as scalar.ElementKind,
    })),
  }
  const data: LayoutedLikeC4ModelData = {
    _stage: 'layouted',
    projectId: OVERVIEW_ID as scalar.ProjectId,
    project: { id: OVERVIEW_ID as scalar.ProjectId },
    specification: { elements: { [PROJECT_KIND]: {} }, relationships: {}, deployments: {}, tags: {} },
    globals: { predicates: {}, dynamicPredicates: {}, styles: {} },
    deployments: { elements: {}, relations: {} },
    elements: {},
    relations: {},
    imports: {},
    views: { [OVERVIEW_ID]: view },
  }
  return LikeC4Model.create(data).view(OVERVIEW_ID as scalar.ViewId)
}

/**
 * Generates D2, Mermaid, PlantUML and Draw.io sources of the projects overview.
 *
 * Requires: a layouted overview.
 * Guarantees: every source describes the same frames, projects and edges.
 */
export function generateProjectsOverviewSources(overview: LayoutedProjectsView): ProjectsOverviewTextSources {
  const viewModel = toViewModel(overview)
  return {
    d2: generateD2(viewModel),
    mmd: generateMermaid(viewModel),
    puml: generatePuml(viewModel),
    drawioEditUrl: generateDrawioEditUrl(generateDrawio(viewModel)),
  }
}
