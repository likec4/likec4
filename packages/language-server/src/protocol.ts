import type {
  ComputedLikeC4ModelData,
  ComputedView,
  DiagramView,
  Fqn,
  LayoutedLikeC4ModelData,
  NonEmptyArray,
  ProjectId,
  RelationId,
  ViewChange,
  ViewId,
} from '@likec4/core'
import { NotificationType, RequestType, RequestType0 } from 'vscode-jsonrpc'
import type { DiagnosticSeverity, DocumentUri, Location, Position } from 'vscode-languageserver-types'

export namespace DidChangeModelNotification {
  export const type = new NotificationType<string>('likec4/onDidChangeModel')
  export type Type = typeof type
}

/**
 * Request to fetch the computed model data
 * If LSP has multiple projects, the projectId is required.
 * otherwise throws an error.
 */
export namespace FetchComputedModel {
  export type Params = {
    projectId?: string | undefined
    cleanCaches?: boolean | undefined
  }
  export type Res = {
    model: ComputedLikeC4ModelData | null
  }
  export const req = new RequestType<Params, Res, void>('likec4/fetchComputedModel')
  export type Req = typeof req
}

/**
 * Request to fetch all views of all projects
 */
export namespace FetchViewsFromAllProjects {
  export type Res = {
    views: Array<{
      id: ViewId
      title: string
      projectId: ProjectId
    }>
  }
  export const req = new RequestType0<Res, void>('likec4/fetchViewsFromAllProjects')
  export type Req = typeof req
}

/**
 * Request to compute a view.
 * If LSP has multiple projects, the projectId is required.
 * otherwise throws an error.
 */
export namespace ComputeView {
  export type Params = {
    viewId: ViewId
    projectId?: string
  }
  export type Result = {
    view: ComputedView | null
  }

  export const req = new RequestType<Params, Result, void>('likec4/computeView')
  export type Req = typeof req
}

/**
 * Request to fetch the layouted model data
 * If LSP has multiple projects, the projectId is required.
 * otherwise throws an error.
 */
export namespace FetchLayoutedModel {
  export type Params = {
    projectId?: string | undefined
  }
  export type Res = {
    model: LayoutedLikeC4ModelData | null
  }

  export const req = new RequestType<Params, Res, void>('likec4/fetchLayoutedModel')
  export type Req = typeof req
}

/**
 * Request to layout a view.
 * If LSP has multiple projects, the projectId is required.
 */
export namespace LayoutView {
  export type Params = {
    viewId: ViewId
    projectId?: string | undefined
  }
  export type Res = {
    result:
      | {
        dot: string
        diagram: DiagramView
      }
      | null
  }

  export const req = new RequestType<Params, Res, void>('likec4/layout-view')
  export type Req = typeof req
}

/**
 * Request to validate all views
 * If projects ID is provided, it will validate only the views of that project.
 */
export namespace ValidateLayout {
  export type Params = {
    projectId?: string
  }

  export type Res = {
    result:
      | {
        uri: string
        viewId: ViewId
        message: string
        severity: DiagnosticSeverity
        range: { start: Position; end: Position }
      }[]
      | null
  }
  export const Req = new RequestType<Params, Res, void>('likec4/validate-layout')
  export type Req = typeof Req
}

/**
 * Request to build documents.
 */
export namespace FetchProjects {
  export type Params = never

  export type Res = {
    projects: {
      [projectId: ProjectId]: NonEmptyArray<DocumentUri>
    }
  }

  export const req = new RequestType0<Res, void>('likec4/fetch-projects')
  export type Req = typeof req
}

/**
 * Request to build documents.
 */
export namespace BuildDocuments {
  export type Params = {
    docs: DocumentUri[]
  }

  export const Req = new RequestType<Params, void, void>('likec4/build')
  export type Req = typeof Req
}

/**
 * Request to locate an element, relation, deployment or view.
 * If LSP has multiple projects, the projectId is required.
 */
export namespace Locate {
  export type Params =
    | {
      element: Fqn
      projectId?: string | undefined
      property?: string
    }
    | {
      projectId?: string | undefined
      relation: RelationId
    }
    | {
      deployment: Fqn
      projectId?: string | undefined
      property?: string
    }
    | {
      view: ViewId
      projectId?: string | undefined
    }
  export type Res = Location | null
  export const Req = new RequestType<Params, Res, void>('likec4/locate')
  export type Req = typeof Req
}
// #endregion

/**
 * Request to change the view
 * If LSP has multiple projects, the projectId is required.
 */
export namespace ChangeView {
  export type Params = {
    viewId: ViewId
    change: ViewChange
    projectId?: string | undefined
  }
  export type Res = Location | null

  export const Req = new RequestType<Params, Res, void>('likec4/change-view')
  export type Req = typeof Req
}

/**
 * Request to fetch telemetry metrics
 */
export namespace FetchTelemetryMetrics {
  export type Res = {
    metrics: null | {
      elementKinds: number
      relationshipKinds: number
      tags: number
      elements: number
      relationships: number
      views: number
      projects: number
    }
  }
  export const req = new RequestType0<Res, void>('likec4/metrics')
  export type Req = typeof req
}
