import type {
  LayoutedProjectEdge,
  LayoutedProjectNode,
  LayoutedProjectsNode,
  LayoutedProjectsView,
} from '@likec4/core/compute-view'
import { ZIndexes } from '../base/const'
import type { ProjectsOverviewTypes } from './_types'

export function layoutedProjectsViewToXYFlow(
  view: LayoutedProjectsView,
): {
  xynodes: ProjectsOverviewTypes.Node[]
  xyedges: ProjectsOverviewTypes.Edge[]
} {
  const byId = new Map(view.nodes.map(node => [node.id, node]))
  return {
    xynodes: view.nodes.map(node => projectNodeToXY(node, byId)),
    xyedges: view.edges.map(edge => projectEdgeToXY(edge, view.routing === 'ortho' ? 'ortho' : 'spline')),
  }
}

function projectNodeToXY(
  node: LayoutedProjectsNode,
  byId: ReadonlyMap<string, LayoutedProjectsNode>,
): ProjectsOverviewTypes.Node {
  const parent = node.parent ? byId.get(node.parent) : undefined
  const position = {
    x: node.x - (parent?.x ?? 0),
    y: node.y - (parent?.y ?? 0),
  }
  const base = {
    id: node.id,
    position,
    draggable: false,
    deletable: false,
    initialWidth: node.width,
    initialHeight: node.height,
    style: {
      width: node.width,
      height: node.height,
    },
    ...(parent ? { parentId: parent.id } : {}),
  }
  if (isProjectNode(node)) {
    const { id: _id, x: _x, y: _y, width, height, ...data } = node
    return {
      ...base,
      type: 'project',
      zIndex: ZIndexes.Element,
      data: {
        id: node.id,
        width,
        height,
        ...data,
      },
    }
  }
  return {
    ...base,
    type: 'project-group',
    zIndex: ZIndexes.Compound,
    data: {
      id: node.id,
      title: node.title,
      color: node.color,
      depth: node.depth ?? 1,
      style: node.style,
      width: node.width,
      height: node.height,
    },
  }
}

function isProjectNode(node: LayoutedProjectsNode): node is LayoutedProjectNode {
  return node.kind === '@project'
}

function projectEdgeToXY(
  { id, source, target, ...edge }: LayoutedProjectEdge,
  routing: 'spline' | 'ortho',
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
      routing,
    },
  }
}
