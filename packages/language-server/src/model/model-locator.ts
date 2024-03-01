import type { likec4 as c4 } from '@likec4/core'
import { InvalidModelError } from '@likec4/core'
import type { CstNode, LangiumDocuments } from 'langium'
import { AstUtils, GrammarUtils } from 'langium'
import type { Location } from 'vscode-languageserver-protocol'
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

  public locateElement(fqn: c4.Fqn, property = 'name'): Location | null {
    const entry = this.fqnIndex.byFqn(fqn).head()
    if (!entry) {
      return null
    }
    const propertyNode = findNodeForProperty(entry.el.$cstNode, property) ?? entry.el.$cstNode
    if (!propertyNode) {
      return null
    }
    return {
      uri: entry.doc.uri.toString(),
      range: propertyNode.range
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
            range: {
              start: targetNode.range.start,
              end: targetNode.range.start
            }
          }
        }
      }
      const targetNode = (node.kind
        ? findNodeForProperty(node.$cstNode, 'kind')
        : findNodeForKeyword(node.$cstNode, '->')) ?? findNodeForProperty(node.$cstNode, 'target')
      return targetNode
        ? {
          uri: doc.uri.toString(),
          range: {
            start: targetNode.range.start,
            end: targetNode.range.end
          }
        }
        : null
    }
    return null
  }

  public locateView(viewId: c4.ViewID): Location | null {
    for (const doc of this.documents()) {
      const view = doc.c4Views.find(r => r.id === viewId)
      if (!view) {
        continue
      }
      const node = this.services.workspace.AstNodeLocator.getAstNode(
        doc.parseResult.value,
        view.astPath
      )
      if (!ast.isElementView(node)) {
        continue
      }
      let targetNode = node.$cstNode
      if (node.name) {
        targetNode = findNodeForProperty(node.$cstNode, 'name') ?? targetNode
      } else if ('viewOf' in node) {
        targetNode = findNodeForProperty(node.$cstNode, 'viewOf') ?? targetNode
      }
      if (!targetNode) {
        return null
      }
      return {
        uri: doc.uri.toString(),
        range: {
          start: targetNode.range.start,
          end: targetNode.range.start
        }
      }
    }
    return null
  }
}
