import type {
  ComputedLikeC4Model,
  ComputedView,
  DiagramView,
  Fqn,
  LayoutedLikeC4Model,
  RelationId,
  ViewChange,
  ViewId,
} from '@likec4/core'
import { NotificationType, RequestType, RequestType0 } from 'vscode-jsonrpc'
import type { DiagnosticSeverity, DocumentUri, Location, Position } from 'vscode-languageserver-types'

// #region From server
export const onDidChangeModel = new NotificationType<string>('likec4/onDidChangeModel')
export type OnDidChangeModelNotification = typeof onDidChangeModel
// #endregion

// #region To server

export namespace FetchComputedModel {
  export type Params = {
    cleanCaches?: boolean | undefined
  }
  export type Res = {
    model: ComputedLikeC4Model | null
  }
  export const Req = new RequestType<Params, Res, void>('likec4/fetchComputedModel')
  export type Req = typeof Req
}

export namespace ComputeView {
  export type Params = {
    viewId: ViewId
  }
  export type Result = {
    view: ComputedView | null
  }

  export const Req = new RequestType<Params, Result, void>('likec4/computeView')
  export type Req = typeof Req
}

export namespace FetchLayoutedModel {
  export type Res = {
    model: LayoutedLikeC4Model | null
  }

  export const Req = new RequestType0<Res, void>('likec4/fetchLayoutedModel')
  export type Req = typeof Req
}

/**
 * Request to layout a view.
 */
export namespace LayoutView {
  export type Params = {
    viewId: ViewId
  }
  export type Res = {
    result:
      | {
        dot: string
        diagram: DiagramView
      }
      | null
  }

  export const Req = new RequestType<Params, Res, void>('likec4/layout-view')
  export type Req = typeof Req
}

/**
 * Request to layout all existing views.
 */

export namespace ValidateLayout {
  export type Params = never
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
  export const Req = new RequestType0<Res, void>('likec4/validate-layout')
  export type Req = typeof Req
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
 */
export namespace Locate {
  export type Params =
    | {
      element: Fqn
      property?: string
    }
    | {
      relation: RelationId
    }
    | {
      deployment: Fqn
      property?: string
    }
    | {
      view: ViewId
    }
  export type Res = Location | null
  export const Req = new RequestType<Params, Res, void>('likec4/locate')
  export type Req = typeof Req
}
// #endregion

export namespace ChangeView {
  export type Params = {
    viewId: ViewId
    change: ViewChange
  }
  export type Res = Location | null

  export const Req = new RequestType<Params, Res, void>('likec4/change-view')
  export type Req = typeof Req
}
