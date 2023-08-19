import type * as c4 from '@likec4/core/types'
import type { LangiumDocuments } from 'langium'
import { findNodeForProperty, getDocument } from 'langium'
import type { Location } from 'vscode-languageserver-protocol'
import type { ParsedAstElement } from '../ast'
import { ElementOps, ast, isParsedLikeC4LangiumDocument } from '../ast'
import type { LikeC4Services } from '../module'
import { isFqnIndexedDocument, type FqnIndex } from './fqn-index'
import { nonNullable } from '@likec4/core'

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
    const fqn = ElementOps.readId(astNode) ?? null
    if (!fqn) return null
    const doc = getDocument(astNode)
    if (!isParsedLikeC4LangiumDocument(doc)) {
      return null
    }
    return doc.c4Elements.find(e => e.id === fqn) ?? null
  }

  public locateElement(fqn: c4.Fqn, property = 'name'): Location | null {
    for (const doc of this.documents()) {
      const entries = doc.c4fqns.get(fqn)
      if (entries.length === 0) {
        continue
      }
      const { el: node } = nonNullable(entries[0])
      const propertyNode = findNodeForProperty(node.$cstNode, property) ?? node.$cstNode
      if (!propertyNode) {
        return null
      }
      return {
        uri: doc.uri.toString(),
        range: propertyNode.range
      }
    }
    return null
  }

  public locateRelation(relationId: c4.RelationID): Location | null {
    for (const doc of this.documents()) {
      const relation = doc.c4Relations.find(r => r.id === relationId)
      if (!relation) {
        continue
      }
      const node = this.services.workspace.AstNodeLocator.getAstNode(doc.parseResult.value, relation.astPath)
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
      const targetNode = findNodeForProperty(node.$cstNode, 'arr')
      if (!targetNode) {
        return null
      }
      return {
        uri: doc.uri.toString(),
        range: {
          start: targetNode.range.end,
          end: targetNode.range.end
        }
      }
    }
    return null
  }

  public locateView(viewId: c4.ViewID): Location | null {
    for (const doc of this.documents()) {
      const view = doc.c4Views.find(r => r.id === viewId)
      if (!view) {
        continue
      }
      const node = this.services.workspace.AstNodeLocator.getAstNode(doc.parseResult.value, view.astPath)
      if (!ast.isElementView(node)) {
        continue
      }
      let targetNode = node.$cstNode
      if (node.name) {
        targetNode = findNodeForProperty(node.$cstNode, 'name') ?? targetNode
      } else if (node.viewOf) {
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
