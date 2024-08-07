import type { likec4 as c4 } from '@likec4/core'
import type { LangiumDocuments } from 'langium'
import { AstUtils, GrammarUtils } from 'langium'
import type { Location } from 'vscode-languageserver-types'
import type { ParsedAstElement } from '../ast'
import { ast, isParsedLikeC4LangiumDocument } from '../ast'
import type { LikeC4Services } from '../module'
import { type FqnIndex } from './fqn-index'

const { findNodeForKeyword, findNodeForProperty } = GrammarUtils
const { getDocument } = AstUtils

export class LikeC4ModelLocator {
  private fqnIndex: FqnIndex
  private langiumDocuments: LangiumDocuments

  constructor(private services: LikeC4Services) {
    this.fqnIndex = services.likec4.FqnIndex
    this.langiumDocuments = services.shared.workspace.LangiumDocuments
  }

  private documents() {
    return this.langiumDocuments.all.filter(isParsedLikeC4LangiumDocument)
  }

  public getParsedElement(astNode: ast.Element): ParsedAstElement | null {
    const fqn = this.fqnIndex.getFqn(astNode)
    if (!fqn) return null
    const doc = getDocument(astNode)
    if (!isParsedLikeC4LangiumDocument(doc)) {
      return null
    }
    return doc.c4Elements.find(e => e.id === fqn) ?? null
  }

  public locateElement(fqn: c4.Fqn, _property = 'name'): Location | null {
    const entry = this.fqnIndex.byFqn(fqn).head()
    if (!entry) {
      return null
    }
    // const propertyNode = findNodeForProperty(entry.el.$cstNode, property) ?? entry.el.$cstNode
    // if (!propertyNode) {
    //   return null
    // }
    return {
      uri: entry.documentUri.toString(),
      range: entry.nameSegment?.range!
    }
  }

  public locateRelation(relationId: c4.RelationID): Location | null {
    for (const doc of this.documents()) {
      const relation = doc.c4Relations.find(r => r.id === relationId)
      if (!relation) {
        continue
      }
      const node = this.services.workspace.AstNodeLocator.getAstNode(
        doc.parseResult.value,
        relation.astPath
      )
      if (!ast.isRelation(node)) {
        continue
      }
      if (node.title) {
        const targetNode = findNodeForProperty(node.$cstNode, 'title')
        if (targetNode) {
          return {
            uri: doc.uri.toString(),
            range: targetNode.range
          }
        }
      }
      let targetNode = node.kind ? findNodeForProperty(node.$cstNode, 'kind') : findNodeForKeyword(node.$cstNode, '->')
      targetNode ??= findNodeForProperty(node.$cstNode, 'target')

      if (!targetNode) {
        return null
      }

      return {
        uri: doc.uri.toString(),
        range: targetNode.range
      }
    }
    return null
  }

  public locateViewAst(viewId: c4.ViewID) {
    for (const doc of this.documents()) {
      const view = doc.c4Views.find(r => r.id === viewId)
      if (!view) {
        continue
      }
      const viewAst = this.services.workspace.AstNodeLocator.getAstNode(
        doc.parseResult.value,
        view.astPath
      )
      if (ast.isLikeC4View(viewAst)) {
        return {
          doc,
          view,
          viewAst
        }
      }
    }
    return null
  }

  public locateView(viewId: c4.ViewID): Location | null {
    const res = this.locateViewAst(viewId)
    if (!res) {
      return null
    }
    const node = res.viewAst
    let targetNode = node.$cstNode
    if (node.name) {
      targetNode = findNodeForProperty(node.$cstNode, 'name') ?? targetNode
    } else if ('viewOf' in node) {
      targetNode = findNodeForProperty(node.$cstNode, 'viewOf') ?? targetNode
    }
    targetNode ??= findNodeForKeyword(node.$cstNode, 'view')
    if (!targetNode) {
      return null
    }
    return {
      uri: res.doc.uri.toString(),
      range: targetNode.range
    }
  }
}
