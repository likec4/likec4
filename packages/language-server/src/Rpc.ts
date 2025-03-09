import { filter, flatMap, funnel, indexBy, keys, map, mapValues, pipe, sort } from 'remeda'
import { logger as rootLogger } from './logger'
import type { LikeC4Services } from './module'

import {
  type DiagramView,
  type LayoutedLikeC4ModelData,
  type ProjectId,
  LikeC4Model,
  nonexhaustive,
} from '@likec4/core'
import { Disposable, interruptAndCheck, URI, UriUtils } from 'langium'
import { DiagnosticSeverity } from 'vscode-languageserver'
import { isLikeC4LangiumDocument } from './ast'
import { isLikeC4Builtin } from './likec4lib'
import {
  BuildDocuments,
  ChangeView,
  ComputeView,
  DidChangeModelNotification,
  FetchComputedModel,
  FetchLayoutedModel,
  FetchProjects,
  FetchTelemetryMetrics,
  FetchViewsFromAllProjects,
  LayoutView,
  Locate,
  ValidateLayout,
} from './protocol'
import { ADisposable } from './utils'

const logger = rootLogger.getChild('rpc')

export class Rpc extends ADisposable {
  constructor(private services: LikeC4Services) {
    super()
  }

  init() {
    const modelBuilder = this.services.likec4.ModelBuilder
    const modelLocator = this.services.likec4.ModelLocator
    const modelEditor = this.services.likec4.ModelChanges
    const views = this.services.likec4.Views
    const connection = this.services.shared.lsp.Connection
    const projects = this.services.shared.workspace.ProjectsManager
    if (!connection) {
      logger.info(`[ServerRpc] no connection, not initializing`)
      return
    }
    logger.info(`[ServerRpc] init`)
    const LangiumDocuments = this.services.shared.workspace.LangiumDocuments
    const DocumentBuilder = this.services.shared.workspace.DocumentBuilder

    const notifyModelParsed = funnel(
      () => {
        logger.debug`sendNotification ${'onDidChangeModel'}`
        connection.sendNotification(DidChangeModelNotification.type, '').catch(e => {
          logger.warn(`[ServerRpc] error sending onDidChangeModel: ${e}`)
          return Promise.resolve()
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
      modelBuilder.onModelParsed(() => notifyModelParsed.call()),
      connection.onRequest(FetchComputedModel.req, async ({ projectId, cleanCaches }, cancelToken) => {
        logger.debug`received request ${'fetchComputedModel'}`
        if (cleanCaches) {
          const docs = projectId ? LangiumDocuments.projectDocuments(projectId as ProjectId) : LangiumDocuments.all
          const uris = docs.map(d => d.uri).toArray()
          await DocumentBuilder.update(uris, [], cancelToken)
        }
        const likec4model = await modelBuilder.buildLikeC4Model(projectId as ProjectId, cancelToken)
        if (likec4model !== LikeC4Model.EMPTY) {
          return { model: likec4model.$model }
        }
        return { model: null }
      }),
      connection.onRequest(ComputeView.req, async ({ viewId, projectId }, cancelToken) => {
        const view = await modelBuilder.computeView(viewId, projectId as ProjectId, cancelToken)
        return { view }
      }),
      connection.onRequest(FetchLayoutedModel.req, async ({ projectId }, cancelToken) => {
        const model = await modelBuilder.parseModel(projectId as ProjectId, cancelToken)
        if (model === null) {
          return { model: null }
        }
        const diagrams = await views.diagrams(projectId as ProjectId, cancelToken)
        return {
          model: {
            ...model,
            __: 'layouted' as const,
            views: indexBy(diagrams, d => d.id),
          } satisfies LayoutedLikeC4ModelData,
        }
      }),
      connection.onRequest(LayoutView.req, async ({ viewId, projectId }, cancelToken) => {
        logger.debug`received request ${'layoutView'} of ${viewId}`
        const result = await views.layoutView(viewId, projectId as ProjectId, cancelToken)
        return { result }
      }),
      connection.onRequest(ValidateLayout.Req, async ({ projectId }, cancelToken) => {
        const layouts = await views.layoutAllViews(projectId as ProjectId, cancelToken)

        const result = reportLayoutDrift(layouts.map(l => l.diagram))

        return { result }
      }),
      connection.onRequest(FetchProjects.req, async (_cancelToken) => {
        const docsByProject = LangiumDocuments.groupedByProject()
        return {
          projects: mapValues(docsByProject, docs => map(docs, d => d.uri.toString())),
        }
      }),
      connection.onRequest(FetchViewsFromAllProjects.req, async (cancelToken) => {
        const promises = projects.all.map(async projectId => {
          const computedViews = await views.computedViews(projectId, cancelToken)
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
        const deleted = LangiumDocuments.all
          .toArray()
          .filter(d => !isLikeC4Builtin(d.uri) && isLikeC4LangiumDocument(d) && notChanged(d.uri))
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
        switch (true) {
          case 'element' in params:
            return modelLocator.locateElement(params.element, params.projectId as ProjectId)
          case 'relation' in params:
            return modelLocator.locateRelation(params.relation, params.projectId as ProjectId)
          case 'view' in params:
            return modelLocator.locateView(params.view, params.projectId as ProjectId)
          case 'deployment' in params:
            return modelLocator.locateDeploymentElement(params.deployment, params.projectId as ProjectId)
          default:
            nonexhaustive(params)
        }
      }),
      connection.onRequest(ChangeView.Req, async (request, _cancelToken) => {
        logger.debug`received request ${'changeView'} of ${request.viewId}`
        return await modelEditor.applyChange(request)
      }),
      connection.onRequest(FetchTelemetryMetrics.req, async (cancelToken) => {
        const projectsIds = [...projects.all]
        const promises = projectsIds.map(async projectId => {
          const model = await modelBuilder.buildLikeC4Model(projectId, cancelToken)
          if (model === LikeC4Model.EMPTY) {
            return Promise.reject(new Error(`Model is empty`))
          }
          return {
            elementKinds: keys(model.$model.specification.elements).length,
            relationshipKinds: keys(model.$model.specification.relationships).length,
            tags: model.$model.specification.tags.length,
            elements: keys(model.$model.elements).length,
            relationships: keys(model.$model.relations).length,
            views: keys(model.$model.views).length,
            projects: 1,
          }
        })
        const results = await Promise.allSettled(promises)
        await interruptAndCheck(cancelToken)

        const values = results.filter(r => r.status === 'fulfilled').map(r => r.value)

        const metrics = values.length > 0
          ? values.reduce((acc, r) => ({
            elementKinds: acc.elementKinds + r.elementKinds,
            relationshipKinds: acc.relationshipKinds + r.relationshipKinds,
            tags: acc.tags + r.tags,
            elements: acc.elements + r.elements,
            relationships: acc.relationships + r.relationships,
            views: acc.views + r.views,
            projects: acc.projects + 1,
          }))
          : null
        return {
          metrics,
        }
      }),
      Disposable.create(() => {
        notifyModelParsed.cancel()
      }),
    )

    function reportLayoutDrift(diagrams: DiagramView<string, string>[]) {
      return pipe(
        diagrams,
        filter(d => !!d.hasLayoutDrift),
        map(d => {
          return {
            uri: modelLocator.locateView(d.id)!.uri,
            viewId: d.id,
            severity: DiagnosticSeverity.Warning,
            message: `Layout drift detected for view '${d.id}'`,
            range: modelLocator.locateView(d.id)!.range,
          }
        }),
      )
    }
  }
}
