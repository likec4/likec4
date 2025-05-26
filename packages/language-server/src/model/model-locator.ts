import type * as c4 from '@likec4/core'
import { ifilter, splitGlobalFqn, toArray } from '@likec4/core'
import { loggable } from '@likec4/log'
import type { Cancellation, LangiumDocuments, Reference } from 'langium'
import { AstUtils, DocumentState, GrammarUtils } from 'langium'
import { flatMap, isString, pipe } from 'remeda'
import type { Location, Range } from 'vscode-languageserver-types'
import { URI } from 'vscode-uri'
import type { ParsedAstElement, ParsedAstView, ParsedLikeC4LangiumDocument } from '../ast'
import { ast, isLikeC4LangiumDocument } from '../ast'
import { logger } from '../logger'
import type { LikeC4Services } from '../module'
import { projectIdFrom } from '../utils'
import type { ProjectsManager } from '../workspace'
import { assignTagColors } from './builder/assignTagColors'
import { MergedSpecification } from './builder/MergedSpecification'
import type { DeploymentsIndex } from './deployments-index'
import { type FqnIndex } from './fqn-index'
import type { LikeC4ModelParser } from './model-parser'

const { findNodeForKeyword, findNodeForProperty } = GrammarUtils
const { getDocument, streamAllContents } = AstUtils

export class LikeC4ModelLocator {
  private fqnIndex: FqnIndex
  private deploymentsIndex: DeploymentsIndex
  private langiumDocuments: LangiumDocuments
  private parser: LikeC4ModelParser
  private projects: ProjectsManager

  constructor(private services: LikeC4Services) {
    this.fqnIndex = services.likec4.FqnIndex
    this.deploymentsIndex = services.likec4.DeploymentsIndex
    this.langiumDocuments = services.shared.workspace.LangiumDocuments
    this.parser = services.likec4.ModelParser
    this.projects = services.shared.workspace.ProjectsManager
  }

  private documents(projectId: c4.ProjectId) {
    return this.parser.documents(projectId)
  }

  // public getParsedElement(astNodeOrFqn: ast.Element): ParsedAstElement | null
  // public getParsedElement(astNodeOrFqn: c4.Fqn, projectId?: c4.ProjectId): ParsedAstElement | null
  public getParsedElement(...args: [ast.Element] | [c4.Fqn] | [c4.Fqn, c4.ProjectId]): ParsedAstElement | null {
    let astNodeOrFqn
    let projectId
    if (args.length === 2) {
      astNodeOrFqn = args[0]
      projectId = args[1]
    } else {
      astNodeOrFqn = args[0]
      projectId = isString(astNodeOrFqn) ? this.projects.ensureProjectId() : projectIdFrom(astNodeOrFqn)
    }

    if (isString(astNodeOrFqn)) {
      const fqn = astNodeOrFqn
      const entry = this.fqnIndex.byFqn(projectId, astNodeOrFqn).head()
      if (!entry) {
        return null
      }
      const doc = this.langiumDocuments.getDocument(entry.documentUri)
      if (!doc) {
        return null
      }
      return this.parser.parse(doc).c4Elements.find(e => e.id === fqn) ?? null
    }

    const fqn = this.fqnIndex.getFqn(astNodeOrFqn)
    const doc = this.parser.parse(getDocument(astNodeOrFqn))
    return doc.c4Elements.find(e => e.id === fqn) ?? null
  }

  public locateElement(fqn: c4.Fqn, projectId?: c4.ProjectId | undefined): Location | null {
    let [_projectId, _fqn] = splitGlobalFqn(fqn)
    _projectId ??= this.projects.ensureProjectId(projectId)
    const entry = this.fqnIndex.byFqn(_projectId, _fqn).head()
    const docsegment = entry?.nameSegment ?? entry?.selectionSegment
    if (!entry || !docsegment) {
      return null
    }
    return {
      uri: entry.documentUri.toString(),
      range: docsegment.range,
    }
  }

  public locateDeploymentElement(fqn: c4.Fqn, projectId?: c4.ProjectId | undefined): Location | null {
    let [_projectId, _fqn] = splitGlobalFqn(fqn)
    _projectId ??= this.projects.ensureProjectId(projectId)
    const entry = this.deploymentsIndex.byFqn(_projectId, _fqn).head()
    const docsegment = entry?.nameSegment ?? entry?.selectionSegment
    if (!entry || !docsegment) {
      return null
    }
    return {
      uri: entry.documentUri.toString(),
      range: docsegment.range,
    }
  }

  public locateRelation(relationId: c4.RelationId, projectId?: c4.ProjectId): Location | null {
    const project = this.projects.ensureProjectId(projectId)
    for (const doc of this.documents(project)) {
      const relation = doc.c4Relations.find(r => r.id === relationId)
        ?? doc.c4DeploymentRelations.find(r => r.id === relationId)
      if (!relation) {
        continue
      }
      const node = this.services.workspace.AstNodeLocator.getAstNode(
        doc.parseResult.value,
        relation.astPath,
      )
      if (!ast.isRelation(node) && !ast.isDeploymentRelation(node)) {
        continue
      }

      let targetNode = node.title ? findNodeForProperty(node.$cstNode, 'title') : undefined
      targetNode ??= node.kind ? findNodeForProperty(node.$cstNode, 'kind') : undefined
      targetNode ??= findNodeForProperty(node.$cstNode, 'target')
      targetNode ??= node.$cstNode

      if (!targetNode) {
        continue
      }

      return {
        uri: doc.uri.toString(),
        range: targetNode.range,
      }
    }
    return null
  }

  public locateViewAst(
    viewId: c4.ViewId,
    projectId?: c4.ProjectId | undefined,
  ): null | { doc: ParsedLikeC4LangiumDocument; view: ParsedAstView; viewAst: ast.LikeC4View } {
    const project = this.projects.ensureProjectId(projectId)
    for (const doc of this.documents(project)) {
      const view = doc.c4Views.find(r => r.id === viewId)
      if (!view) {
        continue
      }
      const viewAst = this.services.workspace.AstNodeLocator.getAstNode(
        doc.parseResult.value,
        view.astPath,
      )
      if (ast.isLikeC4View(viewAst)) {
        return {
          doc,
          view,
          viewAst,
        }
      }
    }
    return null
  }

  public locateView(viewId: c4.ViewId, projectId?: c4.ProjectId): Location | null {
    const res = this.locateViewAst(viewId, projectId)
    if (!res) {
      return null
    }
    const node = res.viewAst
    let targetNode = node.name ? findNodeForProperty(node.$cstNode, 'name') : undefined
    targetNode ??= findNodeForKeyword(node.$cstNode, 'view')
    targetNode ??= node.$cstNode
    if (!targetNode) {
      return null
    }
    return {
      uri: res.doc.uri.toString(),
      range: targetNode.range,
    }
  }

  public async locateDocumentTags(
    documentUri: URI,
    cancelToken?: Cancellation.CancellationToken,
  ): Promise<Array<{ name: string; color: string; range: Range; isSpecification?: boolean }>> {
    const doc = this.langiumDocuments.getDocument(documentUri)
    if (!doc || !isLikeC4LangiumDocument(doc)) {
      return []
    }
    if (doc.state < DocumentState.Validated) {
      logger.debug(`Waiting for document ${doc.uri.path} to be Validated`)
      await this.services.shared.workspace.DocumentBuilder.waitUntil(DocumentState.Validated, doc.uri, cancelToken)
      logger.debug(`Document is validated`)
    }
    const projectId = projectIdFrom(doc)
    try {
      const c4Specification = new MergedSpecification(this.documents(projectId).toArray())
      const tagColors = assignTagColors(c4Specification)
      logger.debug(`Assigned colors to tags`, { tagColors })
      const tags = pipe(
        streamAllContents(doc.parseResult.value),
        ifilter(astNode => ast.isTag(astNode) || ast.isTags(astNode)),
        toArray(),
        flatMap((astNode): Array<ast.Tag | Reference<ast.Tag>> => {
          if (ast.isTag(astNode)) {
            return [astNode]
          }
          return astNode.values
        }),
        flatMap(tagRef => {
          let name: c4.Tag | undefined
          try {
            if (ast.isTag(tagRef)) {
              name = tagRef.name as c4.Tag
              return {
                name,
                color: tagColors[name]!.color,
                range: findNodeForProperty(tagRef.$cstNode, 'name')!.range,
                isSpecification: true,
              }
            }
            name = tagRef.$refText.slice(1) as c4.Tag
            return {
              name,
              color: tagColors[name]!.color,
              range: tagRef.$refNode!.range,
            }
          } catch (err) {
            logger.warn(`Fail on tag ${name}`, { err })
            return []
          }
        }),
      )
      logger.debug(`Found ${tags.length} tags in document ${doc.uri.path}`)
      return tags
    } catch (e) {
      logger.warn(loggable(e))
      return []
    }
  }
}
