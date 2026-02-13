import type * as c4 from '@likec4/core'
import { type ProjectId, type Tag, splitGlobalFqn } from '@likec4/core'
import { LikeC4Styles } from '@likec4/core/styles'
import { ifilter, invariant, toArray } from '@likec4/core/utils'
import { loggable } from '@likec4/log'
import type { Cancellation, CstNode, LangiumDocument, LangiumDocuments } from 'langium'
import { AstUtils, DocumentState, GrammarUtils } from 'langium'
import { flatMap, isString, pipe } from 'remeda'
import type { Location, Range } from 'vscode-languageserver-types'
import { URI } from 'vscode-uri'
import type { ParsedAstElement, ParsedAstView, ParsedLikeC4LangiumDocument } from '../ast'
import { ast } from '../ast'
import { logger as serverLogger } from '../logger'
import type { LikeC4Services } from '../module'
import { projectIdFrom } from '../utils'
import type { ProjectsManager } from '../workspace'
import type { DeploymentsIndex } from './deployments-index'
import type { FqnIndex } from './fqn-index'
import type { LikeC4ModelParser } from './model-parser'

const { findNodeForKeyword, findNodeForProperty } = GrammarUtils
const { getDocument, streamAllContents } = AstUtils

const logger = serverLogger.getChild('locator')

export type ViewLocateResult = {
  doc: ParsedLikeC4LangiumDocument
  view: ParsedAstView
  viewAst: ast.LikeC4View
}

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

  /**
   * Returns the parsed documents
   */
  private documents(projectId: c4.ProjectId) {
    return this.parser.documents(projectId)
  }

  public getParsedElement(
    ...args: [ast.Element] | [c4.Fqn] | [c4.Fqn, c4.ProjectId]
  ): null | {
    projectId: c4.ProjectId
    element: ParsedAstElement
    document: LangiumDocument
  } {
    try {
      let astNodeOrFqn: ast.Element | c4.Fqn
      let projectId: c4.ProjectId
      if (args.length === 2) {
        astNodeOrFqn = args[0]
        projectId = args[1]
      } else {
        astNodeOrFqn = args[0]
        projectId = isString(astNodeOrFqn) ? this.projects.ensureProjectId() : projectIdFrom(astNodeOrFqn)
      }

      if (isString(astNodeOrFqn)) {
        const fqn = astNodeOrFqn
        const entry = this.fqnIndex.byFqn(projectId, fqn).head()
        if (!entry) {
          return null
        }
        const document = this.langiumDocuments.getDocument(entry.documentUri)
        const element = this.findParsedElementByFqnIn(fqn, document)
        return element && document ? { projectId, element, document } : null
      }

      const fqn = this.fqnIndex.getFqn(astNodeOrFqn)
      const document = getDocument(astNodeOrFqn)
      const element = this.findParsedElementByFqnIn(fqn, document)
      return element && document ? { projectId, element, document } : null
    } catch (e) {
      logger.debug(loggable(e))
      return null
    }
  }

  private findParsedElementByFqnIn(fqn: c4.Fqn, doc: LangiumDocument | undefined): ParsedAstElement | undefined {
    if (!doc) {
      return undefined
    }
    return this.parser.parse(doc).c4Elements.find(e => e.id === fqn)
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

  public locateDeploymentElement(
    deploymentFqn: c4.DeploymentFqn,
    projectId?: c4.ProjectId | undefined,
  ): Location | null {
    // let [_projectId, _fqn] = splitGlobalFqn(fqn)
    const _projectId = this.projects.ensureProjectId(projectId)
    // TODO: remove this cast to Fqn
    const fqn = deploymentFqn as unknown as c4.Fqn
    const entry = this.deploymentsIndex.byFqn(_projectId, fqn).head()
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

      let targetNode = node.kind ? findNodeForProperty(node.$cstNode, 'kind') : undefined
      targetNode ??= node.dotKind ? findNodeForProperty(node.$cstNode, 'dotKind') : undefined
      targetNode ??= findNodeForKeyword(node.$cstNode, '->')
      targetNode ??= findNodeForProperty(node.$cstNode, 'title')
      targetNode ??= findNodeForProperty(node.$cstNode, 'target')
      targetNode ??= node.$cstNode

      if (!targetNode) {
        continue
      }

      return {
        uri: doc.uri.toString(),
        range: {
          start: targetNode.range.start,
          end: targetNode.range.start,
        },
      }
    }
    return null
  }

  public locateViewAst(
    viewId: c4.ViewId,
    projectId?: c4.ProjectId | undefined,
  ): null | ViewLocateResult {
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
      range: {
        start: targetNode.range.start,
        end: targetNode.range.start,
      },
    }
  }

  /**
   * Returns an array of tags with their name, color, range and whether they are defined in the specification or not.
   * If the document is not linked, it will wait until it is linked before locating the tags.
   *
   * If the document does not belong to any project, it will return null.
   */
  public async locateDocumentTags(
    documentUri: URI,
    cancelToken?: Cancellation.CancellationToken,
  ): Promise<
    | null
    | Array<{
      name: Tag
      color: c4.ColorLiteral
      range: Range
      isSpecification: boolean
    }>
  > {
    const doc = this.langiumDocuments.getDocument(documentUri)
    if (!doc || !doc.likec4ProjectId) {
      return null
    }
    if (doc.state < DocumentState.Linked) {
      logger.debug(`Waiting for document ${doc.uri.path} to be Linked`)
      await this.services.shared.workspace.DocumentBuilder.waitUntil(DocumentState.Linked, doc.uri, cancelToken)
    }
    const projectId = projectIdFrom(doc)
    logger.trace`locate document tags for ${doc.uri.fsPath} in project ${projectId}`
    try {
      const tagSpecs = this.services.likec4.LastSeen.specification(projectId)?.tags
      const styles = this.services.likec4.LastSeen.styles(projectId) ?? LikeC4Styles.DEFAULT

      if (!tagSpecs) {
        logger.trace(
          `No specification or styles found for project ${projectId}, cannot locate tags for document ${doc.uri.fsPath}`,
        )
        return null
      }

      const tags = pipe(
        streamAllContents(doc.parseResult.value),
        ifilter(astNode => ast.isTag(astNode) || ast.isTagRef(astNode)),
        toArray(),
        flatMap(tagRef => {
          let name: c4.Tag | undefined
          let $cstNode: CstNode | undefined
          try {
            if (ast.isTag(tagRef)) {
              name = tagRef.name as c4.Tag
              $cstNode = tagRef.$cstNode
            } else {
              name = tagRef.tag.$refText as c4.Tag
              $cstNode = tagRef.tag.$refNode
            }
            const specification = tagSpecs[name]
            invariant(specification, `Tag ${name} not found in merged specification`)
            invariant($cstNode, `Tag ${name} does not have a $cstNode`)
            return {
              name,
              color: styles.tagColor(specification.color).fill,
              range: $cstNode.range,
              isSpecification: ast.isTag(tagRef),
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
      return null
    }
  }

  public locateDynamicViewStep(params: {
    view: c4.ViewId
    astPath: string
    projectId?: c4.ProjectId | undefined
  }): Location | null {
    const { doc, viewAst } = this.locateViewAst(params.view, params.projectId) ?? {}
    if (!doc || !viewAst) {
      return null
    }
    if (!ast.isDynamicView(viewAst) || !viewAst.body) {
      logger.warn(`View ${params.view} is not a dynamic view`)
      return null
    }
    const astPath = this.services.workspace.AstNodeLocator.getAstNodePath(viewAst.body) + params.astPath
    const node = this.services.workspace.AstNodeLocator.getAstNode(doc.parseResult.value, astPath)
    if (!node || !ast.isDynamicViewStep(node)) {
      logger.warn(`Failed to locate dynamic view step ${astPath} in view ${params.view}`)
      return null
    }

    let targetNode = node.kind ? findNodeForProperty(node.$cstNode, 'kind') : undefined
    targetNode ??= node.dotKind ? findNodeForProperty(node.$cstNode, 'dotKind') : undefined
    targetNode ??= findNodeForKeyword(node.$cstNode, '->')
    targetNode ??= findNodeForKeyword(node.$cstNode, '<-')
    targetNode ??= findNodeForProperty(node.$cstNode, 'title')
    targetNode ??= findNodeForProperty(node.$cstNode, 'target')
    targetNode ??= node.$cstNode

    if (!targetNode) {
      return null
    }
    return {
      uri: doc.uri.toString(),
      range: {
        start: targetNode.range.start,
        end: targetNode.range.start,
      },
    }
  }
}
