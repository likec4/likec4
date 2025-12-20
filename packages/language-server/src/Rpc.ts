import { filter, funnel, indexBy, keys, map, mapValues, pipe, sort } from 'remeda'
import { logger as rootLogger } from './logger'
import type { LikeC4Services } from './module'

import {
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
  DidChangeSnapshotNotification,
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
      logger.info(`no connection, skip init ServerRpc`)
      return
    }
    logger.info(`init ServerRpc`)
    const likec4Services = this.services.likec4
    const projects = this.services.shared.workspace.ProjectsManager
    const LangiumDocuments = this.services.shared.workspace.LangiumDocuments
    const DocumentBuilder = this.services.shared.workspace.DocumentBuilder

    const notifyModelParsed = funnel(
      (batch: number) => {
        if (batch > 1) {
          logger.debug`send ${'onDidChangeModel'} (${batch} batched)`
        } else {
          logger.debug`send ${'onDidChangeModel'}`
        }
        connection.sendNotification(DidChangeModelNotification.type, '').catch(error => {
          logger.warn(`[ServerRpc] error sending onDidChangeModel:`, { error })
          return
        })
      },
      {
        reducer: (accumulator, req: number) => (accumulator ?? 0) + req,
        triggerAt: 'end',
        minQuietPeriodMs: 200,
        maxBurstDurationMs: 400,
      },
    )

    let isFirstBuild = true

    this.onDispose(
      likec4Services.ModelBuilder.onModelParsed(() => notifyModelParsed.call(1)),
      connection.onRequest(FetchComputedModel.req, async ({ projectId, cleanCaches }, cancelToken) => {
        logger.debug`received request ${'fetchComputedModel'} for project ${projectId} (cleanCaches: ${cleanCaches})`
        if (cleanCaches) {
          const docs = projectId
            ? LangiumDocuments.projectDocuments(projectId as ProjectId)
            : LangiumDocuments.allExcludingBuiltin
          const uris = docs.toArray().map(d => d.uri)
          await DocumentBuilder.update(uris, [], cancelToken)
        }
        const likec4model = await likec4Services.ModelBuilder.computeModel(projectId as ProjectId, cancelToken)
        if (likec4model !== LikeC4Model.EMPTY) {
          return { model: likec4model.$data }
        }
        return { model: null }
      }),
      connection.onNotification(DidChangeSnapshotNotification.type, async ({ snapshotUri }) => {
        logger.debug`received notification ${'onDidChangeSnapshot'} for snapshot ${snapshotUri}`
        const uri = URI.parse(snapshotUri)
        await projects.rebuidProject(
          projects.belongsTo(uri.path),
        )
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
      connection.onRequest(LayoutView.req, async ({
        viewId,
        projectId,
        layoutType,
      }, cancelToken) => {
        logger
          .debug`received request ${'layoutView'} for ${viewId} from project ${projectId} (layout type: ${
          layoutType ?? 'not set'
        })`
        const result = await likec4Services.Views.layoutView({
          viewId,
          projectId: projectId as ProjectId,
          layoutType,
          cancelToken,
        })
        return { result }
      }),
      connection.onRequest(ValidateLayout.req, async ({ projectId }, cancelToken) => {
        logger.debug`received request ${'validateLayout'} for project ${projectId}`
        const layouts = await likec4Services.Views.layoutAllViews(projectId as ProjectId, cancelToken)

        const result = reportLayoutDrift(layouts.map(l => l.diagram))

        return { result }
      }),
      connection.onRequest(FetchProjects.req, async () => {
        logger.debug`received request ${'FetchProjects'}`
        const docsByProject = LangiumDocuments.groupedByProject()
        return {
          projects: mapValues(docsByProject, (docs, projectId) => {
            const {
              folderUri,
              config: {
                name,
                title,
              },
            } = projects.getProject(projectId)
            return {
              folder: folderUri.toString(),
              config: {
                name,
                title,
              },
              docs: map(docs, d => d.uri.toString()),
            }
          }),
        } satisfies FetchProjects.Res
      }),
      connection.onRequest(ReloadProjects.req, async (cancelToken) => {
        logger.debug`received request ${'ReloadProjects'}`
        likec4Services.ManualLayouts.clearCaches()
        await projects.reloadProjects(cancelToken)
        return
      }),
      connection.onRequest(RegisterProject.req, async (params, cancelToken) => {
        logger.debug`received request ${'RegisterProject'}`
        const project = await projects.registerProject(params, cancelToken)
        return { id: project.id }
      }),
      connection.onRequest(FetchViewsFromAllProjects.req, async (cancelToken) => {
        logger.debug`received request ${'FetchViewsFromAllProjects'}`
        const views: FetchViewsFromAllProjects.Res['views'] = []
        for (const projectId of projects.all) {
          await interruptAndCheck(cancelToken)
          try {
            const computedViews = await likec4Services.Views.computedViews(projectId, cancelToken)
            views.push(...pipe(
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
            ))
          } catch (error) {
            logger.warn(`Failed to fetch views for project ${projectId}:`, { error })
          }
        }
        return { views }
      }),
      connection.onRequest(BuildDocuments.req, async ({ docs }, cancelToken) => {
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
      connection.onRequest(Locate.req, params => {
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
      connection.onRequest(ChangeView.req, async (request, cancelToken) => {
        logger.debug`received request ${'changeView'} of ${request.viewId} from project ${request.projectId}`
        const loc = await likec4Services.ModelChanges.applyChange(request)
        const op = request.change.op
        if (
          request.projectId &&
          (op === 'save-view-snapshot' || op === 'reset-manual-layout')
        ) {
          await projects.rebuidProject(request.projectId as ProjectId, cancelToken)
        }
        return loc
      }),
      connection.onRequest(FetchTelemetryMetrics.req, async (cancelToken) => {
        let metrics: FetchTelemetryMetrics.Res['metrics'] = null
        for (const projectId of projects.all) {
          try {
            const model = await likec4Services.ModelBuilder.computeModel(projectId, cancelToken)
            if (model === LikeC4Model.EMPTY) {
              continue
            }
            metrics ??= {
              elementKinds: 0,
              deploymentKinds: 0,
              relationshipKinds: 0,
              tags: 0,
              customColors: 0,
              elements: 0,
              deploymentNodes: 0,
              relationships: 0,
              views: 0,
              projects: 0,
            }
            metrics.elementKinds += keys(model.specification.elements).length
            metrics.deploymentKinds += keys(model.specification.deployments).length
            metrics.relationshipKinds += keys(model.specification.relationships).length
            metrics.tags += keys(model.specification.tags).length
            metrics.customColors += keys(model.specification.customColors ?? {}).length
            metrics.elements += keys(model.$data.elements).length
            metrics.deploymentNodes += [...model.deployment.nodes()].length
            metrics.relationships += keys(model.$data.relations).length
            metrics.views += keys(model.$data.views).length
            metrics.projects += 1
          } catch (err) {
            logger.warn(`Error fetching telemetry metrics for project ${projectId}`, { err })
          }
        }
        await interruptAndCheck(cancelToken)
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
