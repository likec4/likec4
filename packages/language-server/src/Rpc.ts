import { filter, flatMap, funnel, indexBy, keys, map, mapValues, pipe, sort } from 'remeda'
import { logger as rootLogger } from './logger'
import type { LikeC4Services } from './module'

import { serializableLikeC4ProjectConfig } from '@likec4/config'
import {
  type ComputedLikeC4ModelData,
  type DiagramView,
  type LayoutedLikeC4ModelData,
  type ProjectId,
  invariant,
  nonexhaustive,
} from '@likec4/core'
import { LikeC4Model } from '@likec4/core/model'
import { Disposable, interruptAndCheck, URI, UriUtils } from 'langium'
import { DiagnosticSeverity } from 'vscode-languageserver-protocol'
import {
  BuildDocuments,
  ChangeView,
  DidChangeModelNotification,
  DidRequestOpenViewNotification,
  FetchComputedModel,
  FetchLayoutedModel,
  FetchProjects,
  FetchTelemetryMetrics,
  FetchViewsFromAllProjects,
  GetDocumentTags,
  LayoutView,
  Locate,
  RegisterProject,
  ReloadProjects,
  ValidateLayout,
} from './protocol'
import { ADisposable } from './utils'

const logger = rootLogger.getChild('rpc')

export class Rpc extends ADisposable {
  constructor(private services: LikeC4Services) {
    super()
  }

  init() {
    const connection = this.services.shared.lsp.Connection
    if (!connection) {
      logger.info(`[ServerRpc] no connection, not initializing`)
      return
    }
    logger.info(`[ServerRpc] init`)
    const likec4Services = this.services.likec4
    const projects = this.services.shared.workspace.ProjectsManager
    const LangiumDocuments = this.services.shared.workspace.LangiumDocuments
    const DocumentBuilder = this.services.shared.workspace.DocumentBuilder

    const notifyModelParsed = funnel(
      () => {
        logger.debug`sendNotification ${'onDidChangeModel'}`
        connection.sendNotification(DidChangeModelNotification.type, '').catch(error => {
          logger.warn(`[ServerRpc] error sending onDidChangeModel:`, { error })
          return
        })
      },
      {
        triggerAt: 'end',
        minQuietPeriodMs: 150,
        maxBurstDurationMs: 500,
        minGapMs: 300,
      },
    )

    let isFirstBuild = true

    this.onDispose(
      likec4Services.ModelBuilder.onModelParsed(() => notifyModelParsed.call()),
      connection.onRequest(FetchComputedModel.req, async ({ projectId, cleanCaches }, cancelToken) => {
        logger.debug`received request ${'fetchComputedModel'} for project ${projectId}`
        if (cleanCaches) {
          const docs = projectId
            ? LangiumDocuments.projectDocuments(projectId as ProjectId)
            : LangiumDocuments.allExcludingBuiltin
          const uris = docs.toArray().map(d => d.uri)
          await DocumentBuilder.update(uris, [], cancelToken)
        }
        const likec4model = await likec4Services.ModelBuilder.computeModel(projectId as ProjectId, cancelToken)
        if (likec4model !== LikeC4Model.EMPTY) {
          return { model: likec4model.$model as ComputedLikeC4ModelData }
        }
        return { model: null }
      }),
      connection.onRequest(FetchLayoutedModel.req, async ({ projectId }, cancelToken) => {
        logger.debug`received request ${'fetchLayoutedModel'} for project ${projectId}`
        const model = await likec4Services.LanguageServices.layoutedModel(projectId as ProjectId)
        if (model === null) {
          return { model: null }
        }
        const diagrams = await likec4Services.Views.diagrams(projectId as ProjectId, cancelToken)
        return {
          model: {
            ...model.$data,
            _stage: 'layouted' as const,
            views: indexBy(diagrams, d => d.id),
          } satisfies LayoutedLikeC4ModelData,
        }
      }),
      connection.onRequest(LayoutView.req, async ({ viewId, projectId }, cancelToken) => {
        logger.debug`received request ${'layoutView'} for ${viewId} from project ${projectId}`
        const result = await likec4Services.Views.layoutView(viewId, projectId as ProjectId, cancelToken)
        return { result }
      }),
      connection.onRequest(ValidateLayout.Req, async ({ projectId }, cancelToken) => {
        logger.debug`received request ${'validateLayout'} for project ${projectId}`
        const layouts = await likec4Services.Views.layoutAllViews(projectId as ProjectId, cancelToken)

        const result = reportLayoutDrift(layouts.map(l => l.diagram))

        return { result }
      }),
      connection.onRequest(FetchProjects.req, async (_cancelToken) => {
        logger.debug`received request ${'FetchProjects'}`
        const docsByProject = LangiumDocuments.groupedByProject()
        return {
          projects: mapValues(docsByProject, (docs, projectId) => {
            const {
              folderUri,
              config,
            } = projects.getProject(projectId as ProjectId)
            return {
              folder: folderUri.toString(),
              config: serializableLikeC4ProjectConfig(config),
              docs: map(docs, d => d.uri.toString()),
            }
          }),
        }
      }),
      connection.onRequest(ReloadProjects.req, async () => {
        logger.debug`received request ${'ReloadProjects'}`
        likec4Services.ManualLayouts.clearCaches()
        await projects.reloadProjects()
        return
      }),
      connection.onRequest(RegisterProject.req, async (params) => {
        logger.debug`received request ${'RegisterProject'}`
        const project = await projects.registerProject(params)
        return { id: project.id }
      }),
      connection.onRequest(FetchViewsFromAllProjects.req, async (cancelToken) => {
        logger.debug`received request ${'FetchViewsFromAllProjects'}`
        const promises = projects.all.map(async projectId => {
          const computedViews = await likec4Services.Views.computedViews(projectId, cancelToken)
          return pipe(
            computedViews,
            map(v => ({
              id: v.id,
              title: v.title ?? v.id,
              projectId,
            })),
            sort((a, b) => {
              if (a.id === 'index') {
                return -1
              }
              if (b.id === 'index') {
                return 1
              }
              return a.title.localeCompare(b.title)
            }),
          )
        })
        const results = await Promise.allSettled(promises)
        await interruptAndCheck(cancelToken)

        return {
          views: pipe(
            results,
            filter(r => r.status === 'fulfilled'),
            flatMap(r => r.value),
          ),
        }
      }),
      connection.onRequest(BuildDocuments.Req, async ({ docs }, cancelToken) => {
        const changed = docs.map(d => URI.parse(d))
        const notChanged = (uri: URI) => changed.every(c => !UriUtils.equals(c, uri))
        const deleted = LangiumDocuments.allExcludingBuiltin
          .toArray()
          .filter(d => notChanged(d.uri))
          .map(d => d.uri)

        logger.debug(
          `[ServerRpc] received request to build:
  changed (total ${changed.length}):${docs.map(d => '\n    - ' + d).join('')}
  deleted (total ${deleted.length}):${deleted.map(d => '\n    - ' + d.toString()).join('\n')}`,
        )

        if (!isFirstBuild && (changed.length + deleted.length) > 0) {
          await Promise.allSettled(
            [...changed, ...deleted].map(async d => {
              const uri = d.toString()
              logger.debug(`clear diagnostics for ${uri}`)
              try {
                await connection.sendDiagnostics({
                  uri,
                  diagnostics: [],
                })
              } catch (e) {
                // Ignore
                logger.warn(`error clearing diagnostics for ${uri}: ${e}`)
              }
            }),
          )
        }
        isFirstBuild = false
        await interruptAndCheck(cancelToken)
        await DocumentBuilder.update(changed, deleted, cancelToken)
      }),
      connection.onRequest(Locate.Req, params => {
        logger.debug`received request ${'locate'}, ${params}`
        switch (true) {
          case 'element' in params:
            return likec4Services.ModelLocator.locateElement(params.element, params.projectId as ProjectId)
          case 'relation' in params:
            return likec4Services.ModelLocator.locateRelation(params.relation, params.projectId as ProjectId)
          case 'astPath' in params:
            return likec4Services.ModelLocator.locateDynamicViewStep({
              view: params.view,
              astPath: params.astPath,
              projectId: params.projectId as ProjectId,
            })
          case 'view' in params:
            return likec4Services.ModelLocator.locateView(params.view, params.projectId as ProjectId)
          case 'deployment' in params:
            return likec4Services.ModelLocator.locateDeploymentElement(params.deployment, params.projectId as ProjectId)
          default:
            nonexhaustive(params)
        }
      }),
      connection.onRequest(ChangeView.Req, async (request, _cancelToken) => {
        logger.debug`received request ${'changeView'} of ${request.viewId} from project ${request.projectId}`
        return await likec4Services.ModelChanges.applyChange(request)
      }),
      connection.onRequest(FetchTelemetryMetrics.req, async (cancelToken) => {
        const projectsIds = [...projects.all]
        const promises = projectsIds.map(async projectId => {
          const model = await likec4Services.ModelBuilder.computeModel(projectId, cancelToken)
          if (model === LikeC4Model.EMPTY) {
            return Promise.reject(new Error(`Model is empty`))
          }
          return {
            elementKinds: keys(model.specification.elements).length,
            deploymentKinds: keys(model.specification.deployments).length,
            relationshipKinds: keys(model.specification.relationships).length,
            tags: keys(model.specification.tags).length,
            customColors: keys(model.specification.customColors ?? {}).length,
            elements: keys(model.$data.elements).length,
            deploymentNodes: [...model.deployment.nodes()].length,
            relationships: keys(model.$data.relations).length,
            views: keys(model.$data.views).length,
            projects: 1,
          }
        })
        const results = await Promise.allSettled(promises)
        await interruptAndCheck(cancelToken)

        const values = results.filter(r => r.status === 'fulfilled').map(r => r.value)

        const metrics = values.length > 0
          ? values.reduce((acc, r) => ({
            elementKinds: acc.elementKinds + r.elementKinds,
            deploymentKinds: acc.deploymentKinds + r.deploymentKinds,
            relationshipKinds: acc.relationshipKinds + r.relationshipKinds,
            tags: acc.tags + r.tags,
            customColors: acc.customColors + r.customColors,
            elements: acc.elements + r.elements,
            deploymentNodes: acc.deploymentNodes + r.deploymentNodes,
            relationships: acc.relationships + r.relationships,
            views: acc.views + r.views,
            projects: acc.projects + 1,
          }))
          : null
        return {
          metrics,
        }
      }),
      connection.onRequest(GetDocumentTags.req, async ({ documentUri }, cancelToken) => {
        const tags = await likec4Services.ModelLocator.locateDocumentTags(URI.parse(documentUri), cancelToken)
        return {
          tags,
        }
      }),
      Disposable.create(() => {
        notifyModelParsed.cancel()
      }),
    )

    function reportLayoutDrift(diagrams: DiagramView[]) {
      return pipe(
        diagrams,
        filter(d => !!d.hasLayoutDrift),
        map(d => {
          const loc = likec4Services.ModelLocator.locateView(d.id)
          invariant(loc, `View ${d.id} not found`)
          return {
            uri: loc.uri,
            viewId: d.id,
            severity: DiagnosticSeverity.Warning,
            message: `Layout drift detected for view '${d.id}'`,
            range: loc.range,
          }
        }),
      )
    }
  }

  async openView(params: DidRequestOpenViewNotification.Params): Promise<void> {
    const lspConnection = this.services.shared.lsp.Connection
    if (!lspConnection) {
      logger.warn('No LSP connection')
      return
    }
    await lspConnection.sendNotification<DidRequestOpenViewNotification.Params>(
      DidRequestOpenViewNotification.type,
      params,
    )
  }
}
