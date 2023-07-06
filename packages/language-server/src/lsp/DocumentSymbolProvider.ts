import {
  findNodeForProperty,
  type DocumentSymbolProvider,
  type MaybePromise
} from 'langium'
import { compact, isEmpty, map, pipe } from 'remeda'
import { SymbolKind, type DocumentSymbol } from 'vscode-languageserver-protocol'
import { ast, type LikeC4LangiumDocument } from '../ast'
import { logger } from '../logger'
import type { LikeC4Services } from '../module'

function getElementKindSymbol(astKind: ast.SpecificationElementKind): DocumentSymbol | null {
  if (!astKind.$cstNode || !astKind.kind.$cstNode || isEmpty(astKind.kind.name)) return null

  return {
    kind: SymbolKind.Class,
    name: astKind.kind.name,
    range: astKind.$cstNode.range,
    selectionRange: astKind.kind.$cstNode.range
  }
}

function getTagSymbol(astTag: ast.SpecificationTag): DocumentSymbol | null {
  if (!astTag.$cstNode || !astTag.tag.$cstNode || isEmpty(astTag.tag.name)) return null
  return {
    kind: SymbolKind.Interface,
    name: '#' + astTag.tag.name,
    range: astTag.$cstNode.range,
    selectionRange: astTag.tag.$cstNode.range
  }
}

function getElementViewSymbol(astView: ast.ElementView): DocumentSymbol[] {
  const cst = astView?.$cstNode
  if (!cst) return []
  const nameNode = astView.name ? findNodeForProperty(cst, 'name') : null
  if (!nameNode) return []
  return [
    {
      kind: SymbolKind.Class,
      name: nameNode.text,
      range: cst.range,
      selectionRange: nameNode.range,
      children: []
    }
  ]
}

export class LikeC4DocumentSymbolProvider implements DocumentSymbolProvider {
  constructor(private services: LikeC4Services) {}

  getSymbols(document: LikeC4LangiumDocument): MaybePromise<DocumentSymbol[]> {
    const { specification, model, views } = document.parseResult.value
    return [
      () => specification && this.getSpecSymbol(specification),
      () => model && this.getModelSymbol(model),
      () => views && this.getModelViewsSymbol(views)
    ].flatMap(fn => {
      try {
        return fn() ?? []
      } catch (e) {
        logger.error(e)
        return []
      }
    })
  }

  protected getSpecSymbol(astSpec: ast.SpecificationRule): DocumentSymbol[] {
    const cstModel = astSpec?.$cstNode
    if (!cstModel) return []
    const specKeywordNode = findNodeForProperty(cstModel, 'name')
    if (!specKeywordNode) return []

    const specSymbols = pipe(
      astSpec.specs,
      map(nd => {
        if (ast.isSpecificationElementKind(nd)) {
          return getElementKindSymbol(nd)
        } else {
          return getTagSymbol(nd)
        }
      }),
      compact
    )

    if (specSymbols.length === 0) return []

    return [
      {
        kind: SymbolKind.Class,
        name: astSpec.name,
        range: cstModel.range,
        selectionRange: specKeywordNode.range,
        children: specSymbols
      }
    ]
  }

  protected getModelSymbol(astModel: ast.Model): DocumentSymbol[] {
    const cstModel = astModel.$cstNode
    if (!cstModel) return []
    const nameNode = findNodeForProperty(cstModel, 'name')
    if (!nameNode) return []
    return [
      {
        kind: SymbolKind.Class,
        name: astModel.name,
        range: cstModel.range,
        selectionRange: nameNode.range,
        children: astModel.elements.flatMap(e => this.getElementsSymbol(e))
      }
    ]
  }

  protected getElementsSymbol(
    el: ast.Element | ast.Relation | ast.ExtendElement
  ): DocumentSymbol[] {
    try {
      if (ast.isExtendElement(el)) {
        return this.getExtendElementSymbol(el)
      }
      if (ast.isElement(el)) {
        return this.getElementSymbol(el)
      }
    } catch (e) {
      logger.error(e)
    }
    return []
  }

  protected getExtendElementSymbol(astElement: ast.ExtendElement): DocumentSymbol[] {
    const cst = astElement.$cstNode
    const nameNode = astElement.element.$cstNode
    const body = astElement.body
    if (!cst || !nameNode || !body) return []

    return [
      {
        kind: SymbolKind.Constructor,
        name: nameNode.text,
        range: cst.range,
        selectionRange: nameNode.range,
        children: body.elements.flatMap(e => this.getElementsSymbol(e))
      }
    ]
  }

  protected getElementSymbol(astElement: ast.Element): DocumentSymbol[] {
    const cst = astElement.$cstNode
    if (!cst) return []

    const nameNode = findNodeForProperty(cst, 'name')
    if (!nameNode) return []

    const name = astElement.name
    const kind = astElement.kind.$refText
    // TODO: return the title as well
    const detail = kind // + (astElement.title ? ': ' + astElement.title : '').replaceAll('\n', ' ').trim()
    return [
      {
        kind: SymbolKind.Constructor,
        name: name,
        range: cst.range,
        selectionRange: nameNode.range,
        detail,
        children: astElement.body?.elements.flatMap(e => this.getElementsSymbol(e)) ?? []
      }
    ]
  }
  protected getModelViewsSymbol(astViews: ast.ModelViews): DocumentSymbol[] {
    const cst = astViews.$cstNode
    if (!cst) return []
    const nameNode = findNodeForProperty(cst, 'name')
    if (!nameNode) return []
    return [
      {
        kind: SymbolKind.Class,
        name: astViews.name,
        range: cst.range,
        selectionRange: nameNode.range,
        children: astViews.views.flatMap(e => getElementViewSymbol(e))
      }
    ]
  }
}
