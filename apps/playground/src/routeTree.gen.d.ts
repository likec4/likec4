import { Route as rootRoute } from './routes/__root';
import { Route as RedirectAfterAuthImport } from './routes/redirect-after-auth';
import { Route as IndexImport } from './routes/index';
import { Route as WWorkspaceIdRouteImport } from './routes/w.$workspaceId/route';
import { Route as WWorkspaceIdIndexImport } from './routes/w.$workspaceId/index';
import { Route as ShareShareIdIndexImport } from './routes/share.$shareId/index';
import { Route as WWorkspaceIdViewIdImport } from './routes/w.$workspaceId/$viewId';
import { Route as ShareShareIdNotFoundImport } from './routes/share.$shareId/not-found';
import { Route as ShareShareIdEnterPincodeImport } from './routes/share.$shareId/enter-pincode';
import { Route as ShareShareIdViewRouteImport } from './routes/share.$shareId/view/route';
import { Route as ShareShareIdViewViewIdImport } from './routes/share.$shareId/view/$viewId';
declare const RedirectAfterAuthRoute: any;
declare const IndexRoute: any;
declare const WWorkspaceIdIndexRoute: any;
declare const ShareShareIdIndexRoute: any;
declare const WWorkspaceIdViewIdRoute: any;
declare const ShareShareIdNotFoundRoute: any;
declare const ShareShareIdEnterPincodeRoute: any;
declare const ShareShareIdViewViewIdRoute: any;
declare module '@tanstack/react-router' {
    interface FileRoutesByPath {
        '/': {
            id: '/';
            path: '/';
            fullPath: '/';
            preLoaderRoute: typeof IndexImport;
            parentRoute: typeof rootRoute;
        };
        '/redirect-after-auth': {
            id: '/redirect-after-auth';
            path: '/redirect-after-auth';
            fullPath: '/redirect-after-auth';
            preLoaderRoute: typeof RedirectAfterAuthImport;
            parentRoute: typeof rootRoute;
        };
        '/w/$workspaceId': {
            id: '/w/$workspaceId';
            path: '/w/$workspaceId';
            fullPath: '/w/$workspaceId';
            preLoaderRoute: typeof WWorkspaceIdRouteImport;
            parentRoute: typeof rootRoute;
        };
        '/share/$shareId/view': {
            id: '/share/$shareId/view';
            path: '/share/$shareId/view';
            fullPath: '/share/$shareId/view';
            preLoaderRoute: typeof ShareShareIdViewRouteImport;
            parentRoute: typeof rootRoute;
        };
        '/share/$shareId/enter-pincode': {
            id: '/share/$shareId/enter-pincode';
            path: '/share/$shareId/enter-pincode';
            fullPath: '/share/$shareId/enter-pincode';
            preLoaderRoute: typeof ShareShareIdEnterPincodeImport;
            parentRoute: typeof rootRoute;
        };
        '/share/$shareId/not-found': {
            id: '/share/$shareId/not-found';
            path: '/share/$shareId/not-found';
            fullPath: '/share/$shareId/not-found';
            preLoaderRoute: typeof ShareShareIdNotFoundImport;
            parentRoute: typeof rootRoute;
        };
        '/w/$workspaceId/$viewId': {
            id: '/w/$workspaceId/$viewId';
            path: '/$viewId';
            fullPath: '/w/$workspaceId/$viewId';
            preLoaderRoute: typeof WWorkspaceIdViewIdImport;
            parentRoute: typeof WWorkspaceIdRouteImport;
        };
        '/share/$shareId/': {
            id: '/share/$shareId/';
            path: '/share/$shareId';
            fullPath: '/share/$shareId';
            preLoaderRoute: typeof ShareShareIdIndexImport;
            parentRoute: typeof rootRoute;
        };
        '/w/$workspaceId/': {
            id: '/w/$workspaceId/';
            path: '/';
            fullPath: '/w/$workspaceId/';
            preLoaderRoute: typeof WWorkspaceIdIndexImport;
            parentRoute: typeof WWorkspaceIdRouteImport;
        };
        '/share/$shareId/view/$viewId': {
            id: '/share/$shareId/view/$viewId';
            path: '/$viewId';
            fullPath: '/share/$shareId/view/$viewId';
            preLoaderRoute: typeof ShareShareIdViewViewIdImport;
            parentRoute: typeof ShareShareIdViewRouteImport;
        };
    }
}
declare const WWorkspaceIdRouteRouteWithChildren: any;
declare const ShareShareIdViewRouteRouteWithChildren: any;
export interface FileRoutesByFullPath {
    '/': typeof IndexRoute;
    '/redirect-after-auth': typeof RedirectAfterAuthRoute;
    '/w/$workspaceId': typeof WWorkspaceIdRouteRouteWithChildren;
    '/share/$shareId/view': typeof ShareShareIdViewRouteRouteWithChildren;
    '/share/$shareId/enter-pincode': typeof ShareShareIdEnterPincodeRoute;
    '/share/$shareId/not-found': typeof ShareShareIdNotFoundRoute;
    '/w/$workspaceId/$viewId': typeof WWorkspaceIdViewIdRoute;
    '/share/$shareId': typeof ShareShareIdIndexRoute;
    '/w/$workspaceId/': typeof WWorkspaceIdIndexRoute;
    '/share/$shareId/view/$viewId': typeof ShareShareIdViewViewIdRoute;
}
export interface FileRoutesByTo {
    '/': typeof IndexRoute;
    '/redirect-after-auth': typeof RedirectAfterAuthRoute;
    '/share/$shareId/view': typeof ShareShareIdViewRouteRouteWithChildren;
    '/share/$shareId/enter-pincode': typeof ShareShareIdEnterPincodeRoute;
    '/share/$shareId/not-found': typeof ShareShareIdNotFoundRoute;
    '/w/$workspaceId/$viewId': typeof WWorkspaceIdViewIdRoute;
    '/share/$shareId': typeof ShareShareIdIndexRoute;
    '/w/$workspaceId': typeof WWorkspaceIdIndexRoute;
    '/share/$shareId/view/$viewId': typeof ShareShareIdViewViewIdRoute;
}
export interface FileRoutesById {
    __root__: typeof rootRoute;
    '/': typeof IndexRoute;
    '/redirect-after-auth': typeof RedirectAfterAuthRoute;
    '/w/$workspaceId': typeof WWorkspaceIdRouteRouteWithChildren;
    '/share/$shareId/view': typeof ShareShareIdViewRouteRouteWithChildren;
    '/share/$shareId/enter-pincode': typeof ShareShareIdEnterPincodeRoute;
    '/share/$shareId/not-found': typeof ShareShareIdNotFoundRoute;
    '/w/$workspaceId/$viewId': typeof WWorkspaceIdViewIdRoute;
    '/share/$shareId/': typeof ShareShareIdIndexRoute;
    '/w/$workspaceId/': typeof WWorkspaceIdIndexRoute;
    '/share/$shareId/view/$viewId': typeof ShareShareIdViewViewIdRoute;
}
export interface FileRouteTypes {
    fileRoutesByFullPath: FileRoutesByFullPath;
    fullPaths: '/' | '/redirect-after-auth' | '/w/$workspaceId' | '/share/$shareId/view' | '/share/$shareId/enter-pincode' | '/share/$shareId/not-found' | '/w/$workspaceId/$viewId' | '/share/$shareId' | '/w/$workspaceId/' | '/share/$shareId/view/$viewId';
    fileRoutesByTo: FileRoutesByTo;
    to: '/' | '/redirect-after-auth' | '/share/$shareId/view' | '/share/$shareId/enter-pincode' | '/share/$shareId/not-found' | '/w/$workspaceId/$viewId' | '/share/$shareId' | '/w/$workspaceId' | '/share/$shareId/view/$viewId';
    id: '__root__' | '/' | '/redirect-after-auth' | '/w/$workspaceId' | '/share/$shareId/view' | '/share/$shareId/enter-pincode' | '/share/$shareId/not-found' | '/w/$workspaceId/$viewId' | '/share/$shareId/' | '/w/$workspaceId/' | '/share/$shareId/view/$viewId';
    fileRoutesById: FileRoutesById;
}
export interface RootRouteChildren {
    IndexRoute: typeof IndexRoute;
    RedirectAfterAuthRoute: typeof RedirectAfterAuthRoute;
    WWorkspaceIdRouteRoute: typeof WWorkspaceIdRouteRouteWithChildren;
    ShareShareIdViewRouteRoute: typeof ShareShareIdViewRouteRouteWithChildren;
    ShareShareIdEnterPincodeRoute: typeof ShareShareIdEnterPincodeRoute;
    ShareShareIdNotFoundRoute: typeof ShareShareIdNotFoundRoute;
    ShareShareIdIndexRoute: typeof ShareShareIdIndexRoute;
}
export declare const routeTree: any;
export {};
