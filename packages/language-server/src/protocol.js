import { NotificationType, NotificationType0, RequestType, RequestType0 } from 'vscode-jsonrpc';
export var DidChangeModelNotification;
(function (DidChangeModelNotification) {
    DidChangeModelNotification.type = new NotificationType('likec4/onDidChangeModel');
})(DidChangeModelNotification || (DidChangeModelNotification = {}));
/**
 * Triggered by the language server when projects changed
 * (number of projects changed, names changed, etc)
 */
export var DidChangeProjectsNotification;
(function (DidChangeProjectsNotification) {
    DidChangeProjectsNotification.type = new NotificationType0('likec4/onDidChangeProjects');
})(DidChangeProjectsNotification || (DidChangeProjectsNotification = {}));
/**
 * When the snapshot of a manual layout changes
 * Send by the editor to the language server
 */
export var DidChangeSnapshotNotification;
(function (DidChangeSnapshotNotification) {
    DidChangeSnapshotNotification.Method = 'likec4/onDidChangeSnapshot';
    DidChangeSnapshotNotification.type = new NotificationType(DidChangeSnapshotNotification.Method);
})(DidChangeSnapshotNotification || (DidChangeSnapshotNotification = {}));
/**
 * When server requests to open a likec4 preview panel
 * (available only in the editor).
 * (not the best place, but seems to be working)
 */
export var DidRequestOpenViewNotification;
(function (DidRequestOpenViewNotification) {
    DidRequestOpenViewNotification.type = new NotificationType('likec4/onRequestOpenView');
})(DidRequestOpenViewNotification || (DidRequestOpenViewNotification = {}));
/**
 * Request to fetch the computed model data
 * If LSP has multiple projects, the projectId is required.
 * otherwise throws an error.
 */
export var FetchComputedModel;
(function (FetchComputedModel) {
    FetchComputedModel.req = new RequestType('likec4/fetchComputedModel');
})(FetchComputedModel || (FetchComputedModel = {}));
/**
 * Request to fetch all views of all projects
 */
export var FetchViewsFromAllProjects;
(function (FetchViewsFromAllProjects) {
    FetchViewsFromAllProjects.req = new RequestType0('likec4/fetchViewsFromAllProjects');
})(FetchViewsFromAllProjects || (FetchViewsFromAllProjects = {}));
/**
 * Request to fetch the layouted model data
 * If LSP has multiple projects, the projectId is required.
 * otherwise throws an error.
 */
export var FetchLayoutedModel;
(function (FetchLayoutedModel) {
    FetchLayoutedModel.req = new RequestType('likec4/fetchLayoutedModel');
})(FetchLayoutedModel || (FetchLayoutedModel = {}));
/**
 * Request to layout a view.
 * If LSP has multiple projects, the projectId is required.
 */
export var LayoutView;
(function (LayoutView) {
    LayoutView.req = new RequestType('likec4/layout-view');
})(LayoutView || (LayoutView = {}));
/**
 * Request to validate all views
 * If projects ID is provided, it will validate only the views of that project.
 */
export var ValidateLayout;
(function (ValidateLayout) {
    ValidateLayout.req = new RequestType('likec4/validate-layout');
})(ValidateLayout || (ValidateLayout = {}));
/**
 * Request to reload projects.
 */
export var ReloadProjects;
(function (ReloadProjects) {
    ReloadProjects.req = new RequestType0('likec4/reload-projects');
})(ReloadProjects || (ReloadProjects = {}));
/**
 * Fetch all non-empty projects.
 */
export var FetchProjects;
(function (FetchProjects) {
    FetchProjects.req = new RequestType0('likec4/fetch-projects');
})(FetchProjects || (FetchProjects = {}));
/**
 * Request from the client to register a project.
 */
export var RegisterProject;
(function (RegisterProject) {
    RegisterProject.req = new RequestType('likec4/register-project');
})(RegisterProject || (RegisterProject = {}));
/**
 * Request to build documents.
 */
export var BuildDocuments;
(function (BuildDocuments) {
    BuildDocuments.req = new RequestType('likec4/build');
})(BuildDocuments || (BuildDocuments = {}));
/**
 * Request to locate an element, relation, deployment or view.
 * If LSP has multiple projects, the projectId is required.
 */
export var Locate;
(function (Locate) {
    Locate.req = new RequestType('likec4/locate');
})(Locate || (Locate = {}));
// #endregion
/**
 * Request to change the view
 * If LSP has multiple projects, the projectId is required.
 */
export var ChangeView;
(function (ChangeView) {
    ChangeView.req = new RequestType('likec4/change-view');
})(ChangeView || (ChangeView = {}));
/**
 * Request to fetch telemetry metrics
 */
export var FetchTelemetryMetrics;
(function (FetchTelemetryMetrics) {
    FetchTelemetryMetrics.req = new RequestType0('likec4/metrics');
})(FetchTelemetryMetrics || (FetchTelemetryMetrics = {}));
/**
 * Request to fetch all tags of a document
 */
export var GetDocumentTags;
(function (GetDocumentTags) {
    GetDocumentTags.req = new RequestType('likec4/document-tags');
})(GetDocumentTags || (GetDocumentTags = {}));
/**
 * Request to fetch projects overview diagram
 */
export var FetchProjectsOverview;
(function (FetchProjectsOverview) {
    FetchProjectsOverview.req = new RequestType0('likec4/fetch-projects-overview');
})(FetchProjectsOverview || (FetchProjectsOverview = {}));
