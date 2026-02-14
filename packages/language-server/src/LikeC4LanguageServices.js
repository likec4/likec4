import { nonexhaustive, } from '@likec4/core';
import { computeProjectsView } from '@likec4/core/compute-view';
import { LikeC4Model } from '@likec4/core/model';
import { loggable } from '@likec4/log';
import { entries, filter, flatMap, hasAtLeast, indexBy, map, pipe, prop } from 'remeda';
import { DiagnosticSeverity } from 'vscode-languageserver-types';
import { logger as mainLogger } from './logger';
const logger = mainLogger.getChild('LanguageServices');
const isErrorDiagnostic = (d) => d.severity === DiagnosticSeverity.Error;
/**
 * Public Language Services
 */
export class DefaultLikeC4LanguageServices {
    services;
    builder;
    editor;
    projectsManager;
    constructor(services) {
        this.services = services;
        this.builder = services.likec4.ModelBuilder;
        this.projectsManager = services.shared.workspace.ProjectsManager;
        this.editor = services.likec4.ModelChanges;
    }
    get views() {
        return this.services.likec4.Views;
    }
    get workspaceUri() {
        return this.services.shared.workspace.WorkspaceManager.workspaceUri;
    }
    projects() {
        const projectsManager = this.services.shared.workspace.ProjectsManager;
        const projectsWithDocs = pipe(this.services.shared.workspace.LangiumDocuments.groupedByProject(), entries(), map(([projectId, docs]) => {
            const id = projectId;
            const { folderUri, config } = projectsManager.getProject(id);
            return {
                id,
                folder: folderUri,
                title: config.title ?? config.name,
                documents: map(docs, prop('uri')),
                config,
            };
        }));
        // if there are multiple projects and default project is set, ensure it is first
        if (hasAtLeast(projectsWithDocs, 2) && projectsManager.defaultProjectId) {
            const idx = projectsWithDocs.findIndex(p => p.id === projectsManager.defaultProjectId);
            if (idx > 0) {
                const [defaultProject] = projectsWithDocs.splice(idx, 1);
                return [defaultProject, ...projectsWithDocs];
            }
            return projectsWithDocs;
        }
        if (hasAtLeast(projectsWithDocs, 1)) {
            return projectsWithDocs;
        }
        const { id, folderUri, config } = projectsManager.default;
        return [{
                id,
                folder: folderUri,
                title: config.title ?? config.name,
                documents: [],
                config,
            }];
    }
    project(projectId) {
        const { id, folderUri, config } = this.projectsManager.ensureProject(projectId);
        const documents = map(this.services.shared.workspace.LangiumDocuments.projectDocuments(id).toArray(), prop('uri'));
        return {
            id,
            folder: folderUri,
            title: config.title ?? config.name,
            documents,
            config,
        };
    }
    async diagrams(project, cancelToken) {
        const projectId = this.projectsManager.ensureProjectId(project);
        return await this.views.diagrams(projectId, cancelToken);
    }
    async computedModel(project, cancelToken) {
        const projectId = this.projectsManager.ensureProjectId(project);
        return await this.builder.computeModel(projectId, cancelToken);
    }
    async layoutedModel(project, cancelToken) {
        const projectId = this.projectsManager.ensureProjectId(project);
        const model = await this.builder.computeModel(projectId, cancelToken);
        if (!model) {
            throw new Error('Failed to compute model, empty project?');
        }
        const layouted = await this.views.layoutAllViews(projectId, cancelToken);
        return LikeC4Model.create({
            ...model.$data,
            _stage: 'layouted',
            views: pipe(layouted, map(prop('diagram')), indexBy(prop('id'))),
        });
    }
    async projectsOverview(cancelToken) {
        const allProjects = this.services.shared.workspace.ProjectsManager.all;
        const models = [];
        for (const project of allProjects) {
            const model = await this.builder.computeModel(project, cancelToken);
            if (cancelToken?.isCancellationRequested) {
                throw new Error('Operation cancelled');
            }
            if (model === LikeC4Model.EMPTY) {
                logger.debug(`Project ${project} is empty, skipping`);
                continue;
            }
            models.push(model);
        }
        if (!hasAtLeast(models, 1)) {
            throw new Error('No models found');
        }
        const projectsView = computeProjectsView(models);
        return await this.views.layouter.layoutProjectsView(projectsView);
    }
    getErrors() {
        return pipe(this.services.shared.workspace.LangiumDocuments.userDocuments.toArray(), flatMap(doc => {
            return pipe(doc.diagnostics ?? [], filter(isErrorDiagnostic), map(({ message, range }) => ({
                message,
                line: range.start.line,
                range,
                sourceFsPath: doc.uri.fsPath,
            })));
        }));
    }
    locate(params) {
        switch (true) {
            case 'element' in params:
                return this.services.likec4.ModelLocator.locateElement(params.element, params.projectId);
            case 'relation' in params:
                return this.services.likec4.ModelLocator.locateRelation(params.relation, params.projectId);
            case 'view' in params:
                return this.services.likec4.ModelLocator.locateView(params.view, params.projectId);
            case 'deployment' in params:
                return this.services.likec4.ModelLocator.locateDeploymentElement(params.deployment, params.projectId);
            default:
                nonexhaustive(params);
        }
    }
    async dispose() {
        try {
            logger.debug('disposing LikeC4LanguageServices');
            await this.services.shared.workspace.FileSystemWatcher.dispose();
            if (this.services.mcp.Server.isStarted) {
                await this.services.mcp.Server.stop();
            }
            this.services.Rpc.dispose();
            this.services.likec4.ModelBuilder.dispose();
        }
        catch (e) {
            logger.error(loggable(e));
        }
        finally {
            logger.debug('LikeC4LanguageServices disposed');
        }
    }
}
