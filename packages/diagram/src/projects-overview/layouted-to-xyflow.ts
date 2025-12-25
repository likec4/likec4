import type {
  LayoutedProjectEdge,
  LayoutedProjectNode,
  LayoutedProjectsView,
} from '@likec4/core/compute-view'
import { map } from 'remeda'
import { ZIndexes } from '../base/const'
import type { ProjectsOverviewTypes } from './_types'

export function layoutedProjectsViewToXYFlow(
  view: LayoutedProjectsView,
): {
  xynodes: ProjectsOverviewTypes.Node[]
  xyedges: ProjectsOverviewTypes.Edge[]
} {
  return {
    xynodes: map(view.nodes, projectNodeToXY),
    xyedges: map(view.edges, projectEdgeToXY),
  }
}

function projectNodeToXY(
  { id, x, y, width, height, ...node }: LayoutedProjectNode,
): ProjectsOverviewTypes.Node {
  return {
    id,
    position: { x, y },
    type: 'project',
    initialWidth: width,
    initialHeight: height,
    draggable: false,
    deletable: false,
    zIndex: ZIndexes.Element,
    style: {
      width,
      height,
    },
    data: {
      id,
      width,
      height,
      ...node,
    },
  }
}

function projectEdgeToXY(
  { id, source, target, ...edge }: LayoutedProjectEdge,
): ProjectsOverviewTypes.Edge {
  return {
    id,
    source,
    target,
    type: 'relationship',
    zIndex: ZIndexes.Edge,
    deletable: false,
    data: {
      id,
      technology: null,
      labelBBox: null,
      ...edge,
    },
  }
}
