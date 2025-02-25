import type * as c4 from '@likec4/core'
import type { LangiumDocuments } from 'langium'
import { AstUtils, GrammarUtils } from 'langium'
import { isString } from 'remeda'
import type { Location } from 'vscode-languageserver-types'
import type { ParsedAstElement } from '../ast'
import { ast, isParsedLikeC4LangiumDocument } from '../ast'
import type { LikeC4Services } from '../module'
import type { DeploymentsIndex } from './deployments-index'
import { type FqnIndex } from './fqn-index'
import type { LikeC4ModelParser } from './model-parser'

const { findNodeForKeyword, findNodeForProperty } = GrammarUtils
const { getDocument } = AstUtils

export class LikeC4ModelLocator {
  private fqnIndex: FqnIndex
  private deploymentsIndex: DeploymentsIndex
  private langiumDocuments: LangiumDocuments
  private parser: LikeC4ModelParser

  constructor(private services: LikeC4Services) {
    this.fqnIndex = services.likec4.FqnIndex
    this.deploymentsIndex = services.likec4.DeploymentsIndex
    this.langiumDocuments = services.shared.workspace.LangiumDocuments
    this.parser = services.likec4.ModelParser
  }

  private documents() {
    return this.parser.documents().toArray()
  }

  public getParsedElement(astNodeOrFqn: ast.Element | c4.Fqn): ParsedAstElement | null {
    if (isString(astNodeOrFqn)) {
      const fqn = astNodeOrFqn
      const entry = this.fqnIndex.byFqn(astNodeOrFqn).head()
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

  public locateElement(fqn: c4.Fqn, _prop?: string): Location | null {
    const entry = this.fqnIndex.byFqn(fqn).head()
    const docsegment = entry?.nameSegment ?? entry?.selectionSegment
    if (!entry || !docsegment) {
      return null
    }
    return {
      uri: entry.documentUri.toString(),
      range: docsegment.range,
    }
  }
  public locateDeploymentElement(fqn: c4.Fqn, _prop?: string): Location | null {
    const entry = this.deploymentsIndex.byFqn(fqn).head()
    const docsegment = entry?.nameSegment ?? entry?.selectionSegment
    if (!entry || !docsegment) {
      return null
    }
    return {
      uri: entry.documentUri.toString(),
      range: docsegment.range,
    }
  }

  public locateRelation(relationId: c4.RelationId): Location | null {
    for (const doc of this.documents()) {
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

  public locateViewAst(viewId: c4.ViewId) {
    for (const doc of this.documents()) {
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

  public locateView(viewId: c4.ViewId): Location | null {
    const res = this.locateViewAst(viewId)
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
}
