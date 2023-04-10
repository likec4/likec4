/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import invariant from 'tiny-invariant'
import { findNodeForProperty, type DocumentSymbolProvider, type MaybePromise } from 'langium'
import { SymbolKind, type DocumentSymbol } from 'vscode-languageserver-protocol'
import { type LikeC4LangiumDocument, ast } from '../ast'
import type { LikeC4Services } from '../module'

export class LikeC4DocumentSymbolProvider implements DocumentSymbolProvider {

  constructor(private services: LikeC4Services) {
  }

  getSymbols(document: LikeC4LangiumDocument): MaybePromise<DocumentSymbol[]> {
    const { specification, model, views } = document.parseResult.value
    return [
      ...this.getSpecSymbols(specification),
      ...this.getModelSymbols(model),
      ...this.getModelViewsSymbols(views)
    ]
  }

  protected getSpecSymbols = (astSpec: ast.SpecificationRule | undefined): DocumentSymbol[] => {
    const cstModel = astSpec?.$cstNode
    if (!cstModel) return []
    const specKeywordNode = findNodeForProperty(cstModel, 'name')
    if (!specKeywordNode) return []

    const specSymbols: DocumentSymbol[] = []

    const getElementKindSymbol = (astKind: ast.SpecificationElementKind): DocumentSymbol => {
      invariant(astKind.$cstNode, 'SpecificationElementKind must have a CST node')
      invariant(astKind.kind.$cstNode, 'SpecificationElementKind name must have a CST node')

      return {
        kind: SymbolKind.Class,
        name: astKind.kind.name,
        range: astKind.$cstNode.range,
        selectionRange: astKind.kind.$cstNode.range
      }
    }
    for (const astKind of astSpec.elementKinds) {
      specSymbols.push(getElementKindSymbol(astKind))
    }

    const getTagSymbol = (astTag: ast.SpecificationTag): DocumentSymbol => {
      invariant(astTag.$cstNode, 'TagSpec must have a CST node')
      invariant(astTag.tag.$cstNode, 'Tag name must have a CST node')

      return {
        kind: SymbolKind.EnumMember,
        name: '#' + astTag.tag.name,
        range: astTag.$cstNode.range,
        selectionRange: astTag.tag.$cstNode.range
      }
    }

    for (const astTag of astSpec.tags) {
      specSymbols.push(getTagSymbol(astTag))
    }

    if (specSymbols.length === 0) return []

    return [{
      kind: SymbolKind.Class,
      name: astSpec.name,
      range: cstModel.range,
      selectionRange: specKeywordNode.range,
      children: specSymbols
    }]
  }

  protected getModelSymbols = (astModel: ast.Model | undefined): DocumentSymbol[] => {
    const cstModel = astModel?.$cstNode
    if (!cstModel) return []
    const nameNode = findNodeForProperty(cstModel, 'name')
    if (!nameNode) return []
    return [{
      kind: SymbolKind.Class,
      name: astModel.name,
      range: cstModel.range,
      selectionRange: nameNode.range,
      children: astModel.elements.flatMap(this.getElementsSymbol)
    }]
  }

  protected getElementsSymbol = (el: ast.Element | ast.Relation | ast.ExtendElement): DocumentSymbol[] => {
    if (ast.isExtendElement(el)) {
      return this.getExtendElementSymbol(el)
    }
    if (ast.isElement(el)) {
      return this.getElementSymbol(el)
    }
    return []
  }

  protected getExtendElementSymbol = (astElement: ast.ExtendElement): DocumentSymbol[] => {
    const cst = astElement.$cstNode
    const nameNode = astElement.element.$cstNode
    if (!cst || !nameNode) return []

    return [{
      kind: SymbolKind.Constructor,
      name: nameNode.text,
      range: cst.range,
      selectionRange: nameNode.range,
      children: astElement.body.elements.flatMap(this.getElementsSymbol)
    }]
  }

  protected getElementSymbol = (astElement: ast.Element): DocumentSymbol[] => {
    const cst = astElement.$cstNode
    if (!cst) return []

    const nameNode = findNodeForProperty(cst, 'name')
    if (!nameNode) return []

    const name = astElement.name
    const kind = astElement.kind.$refText
    // TODO: return the title as well
    const detail = kind // + (astElement.title ? ': ' + astElement.title : '').replaceAll('\n', ' ').trim()
    return [{
      kind: SymbolKind.Constructor,
      name: name,
      range: cst.range,
      selectionRange: nameNode.range,
      detail,
      children: astElement.body?.elements.flatMap(this.getElementsSymbol) ?? []
    }]
  }

  protected getModelViewsSymbols = (astViews: ast.ModelViews | undefined): DocumentSymbol[] => {
    const cst = astViews?.$cstNode
    if (!cst) return []
    const nameNode = findNodeForProperty(cst, 'name')
    if (!nameNode) return []
    return [{
      kind: SymbolKind.Class,
      name: astViews.name,
      range: cst.range,
      selectionRange: nameNode.range,
      children: []
    }]
  }

  // protected getElementViewSymbol = (astView: ast.ElementView): DocumentSymbol[] => {
  //   const cst = astView?.$cstNode
  //   if (!cst) return []
  //   let
  //   if (astView.name) {
  //     const nameNode = findNodeForProperty(cst, 'name')
  //   }

  //   if (!nameNode) return []
  //   return [{
  //     kind: SymbolKind.Class,
  //     name: astView.name,
  //     range: cst.range,
  //     selectionRange: nameNode.range,
  //     children: []
  //   }]
  // }
}
