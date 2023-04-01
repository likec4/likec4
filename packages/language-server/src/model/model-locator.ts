import type * as c4 from '@likec4/core/types'
import type { AstNodeDescription, LangiumDocuments } from 'langium'
import { findNodeForKeyword, findNodeForProperty } from 'langium'
import { head } from 'rambdax'
import type { Location } from 'vscode-languageserver-protocol'
import { ast, isParsedLikeC4LangiumDocument } from '../ast'
import type { LikeC4Services } from '../module'
import type { FqnIndex } from './fqn-index'


export class LikeC4ModelLocator {

  private fqnIndex: FqnIndex
  private langiumDocuments: LangiumDocuments

  constructor(private services: LikeC4Services) {
    this.fqnIndex = services.likec4.FqnIndex
    this.langiumDocuments = services.shared.workspace.LangiumDocuments
  }

  private documents() {
    return this.langiumDocuments.all.toArray().filter(isParsedLikeC4LangiumDocument)
  }

  public locateElement(fqn: c4.Fqn, property = 'name'): Location | null {
    const descr = head(this.fqnIndex.byFqn(fqn) as AstNodeDescription[])

    if (!descr) return null

    const docUri = descr.documentUri.toString()
    const doc = this.documents().find(d => d.uri.toString() === docUri)
    const node = doc && this.services.workspace.AstNodeLocator.getAstNode(doc.parseResult.value, descr.path)

    if (!ast.isElement(node) || !node.$cstNode) return null

    const propertyNode = findNodeForProperty(node.$cstNode, property)
    return {
      uri: docUri,
      range: propertyNode?.range ?? node.$cstNode.range
    }
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
      const targetNode = findNodeForKeyword(node.$cstNode, '->')
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
