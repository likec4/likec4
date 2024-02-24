/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as EmbedViewIdImport } from './routes/embed.$viewId.tsx'
import { Route as IndexImport } from './routes/index.tsx'
import { Route as ViewViewIdAsDotImport } from './routes/view.$viewId._as.dot.tsx'
import { Route as ViewViewIdAsMmdImport } from './routes/view.$viewId._as.mmd.tsx'
import { Route as ViewViewIdAsImport } from './routes/view.$viewId._as.tsx'
import { Route as ViewViewIdEditorImport } from './routes/view.$viewId.editor.tsx'
import { Route as ViewViewIdReactImport } from './routes/view.$viewId.react.tsx'
import { Route as ViewViewIdImport } from './routes/view.$viewId.tsx'

// Create/Update Routes

const IndexRoute = IndexImport.update({
  path: '/',
  getParentRoute: () => rootRoute
} as any)

const ViewViewIdRoute = ViewViewIdImport.update({
  path: '/view/$viewId',
  getParentRoute: () => rootRoute
} as any)

const EmbedViewIdRoute = EmbedViewIdImport.update({
  path: '/embed/$viewId',
  getParentRoute: () => rootRoute
} as any)

const ViewViewIdReactRoute = ViewViewIdReactImport.update({
  path: '/react',
  getParentRoute: () => ViewViewIdRoute
} as any)

const ViewViewIdEditorRoute = ViewViewIdEditorImport.update({
  path: '/editor',
  getParentRoute: () => ViewViewIdRoute
} as any)

const ViewViewIdAsRoute = ViewViewIdAsImport.update({
  id: '/_as',
  getParentRoute: () => ViewViewIdRoute
} as any)

const ViewViewIdAsMmdRoute = ViewViewIdAsMmdImport.update({
  path: '/mmd',
  getParentRoute: () => ViewViewIdAsRoute
} as any)

const ViewViewIdAsDotRoute = ViewViewIdAsDotImport.update({
  path: '/dot',
  getParentRoute: () => ViewViewIdAsRoute
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/embed/$viewId': {
      preLoaderRoute: typeof EmbedViewIdImport
      parentRoute: typeof rootRoute
    }
    '/view/$viewId': {
      preLoaderRoute: typeof ViewViewIdImport
      parentRoute: typeof rootRoute
    }
    '/view/$viewId/_as': {
      preLoaderRoute: typeof ViewViewIdAsImport
      parentRoute: typeof ViewViewIdImport
    }
    '/view/$viewId/editor': {
      preLoaderRoute: typeof ViewViewIdEditorImport
      parentRoute: typeof ViewViewIdImport
    }
    '/view/$viewId/react': {
      preLoaderRoute: typeof ViewViewIdReactImport
      parentRoute: typeof ViewViewIdImport
    }
    '/view/$viewId/_as/dot': {
      preLoaderRoute: typeof ViewViewIdAsDotImport
      parentRoute: typeof ViewViewIdAsImport
    }
    '/view/$viewId/_as/mmd': {
      preLoaderRoute: typeof ViewViewIdAsMmdImport
      parentRoute: typeof ViewViewIdAsImport
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren([
  IndexRoute,
  EmbedViewIdRoute,
  ViewViewIdRoute.addChildren([
    ViewViewIdAsRoute.addChildren([ViewViewIdAsDotRoute, ViewViewIdAsMmdRoute]),
    ViewViewIdEditorRoute,
    ViewViewIdReactRoute
  ])
])

/* prettier-ignore-end */