import { nonexhaustive } from '@likec4/core'
import { type AstNode, type LangiumDocument, AstUtils, DocumentState, GrammarUtils } from 'langium'
import type { DocumentSymbolProvider, NodeKindProvider } from 'langium/lsp'
import { filter, isEmpty, isTruthy, map, pipe } from 'remeda'
import type { CancellationToken, DocumentSymbolParams } from 'vscode-languageserver'
import { type DocumentSymbol, SymbolKind } from 'vscode-languageserver-types'
import { ast, isLikeC4LangiumDocument } from '../ast'
import { logger as rootLogger, logWarnError } from '../logger'
import type { LikeC4ModelLocator, LikeC4ModelParser } from '../model'
import type { LikeC4Services } from '../module'
import type { LikeC4NameProvider } from '../references'
import { readStrictFqn } from '../utils/elementRef'

const logger = rootLogger.getChild('DocumentSymbolProvider')

export class LikeC4DocumentSymbolProvider implements DocumentSymbolProvider {
  protected readonly nodeKindProvider: NodeKindProvider
  protected readonly nameProvider: LikeC4NameProvider
  protected readonly parser: LikeC4ModelParser
  protected readonly locator: LikeC4ModelLocator

  constructor(private services: LikeC4Services) {
    this.nodeKindProvider = services.shared.lsp.NodeKindProvider
    this.parser = services.likec4.ModelParser
    this.locator = services.likec4.ModelLocator
    this.nameProvider = services.references.NameProvider
  }

  async getSymbols(
    doc: LangiumDocument,
    _params: DocumentSymbolParams,
    cancelToken?: CancellationToken,
  ): Promise<DocumentSymbol[]> {
    if (!isLikeC4LangiumDocument(doc)) {
      return []
    }
    if (doc.state <= DocumentState.Linked) {
      logger.debug(`Waiting for document ${doc.uri.path} to be Linked`)
      await this.services.shared.workspace.DocumentBuilder.waitUntil(DocumentState.Linked, doc.uri, cancelToken)
      logger.debug(`document is Linked`)
    }
    const {
      parseResult: {
        value: { specifications, models, deployments, views, likec4lib },
      },
    } = doc

    return [
      ...likec4lib.map(l => () => this.getLikec4LibSymbol(l)),
      ...specifications.map(s => () => this.getSpecSymbol(s)),
      ...models.map(s => () => this.getModelSymbol(s)),
      ...deployments.map(s => () => this.getDeploymentModelSymbol(s)),
      ...views.map(s => () => this.getModelViewsSymbol(s)),
    ].flatMap(fn => {
      try {
        return fn() ?? []
      } catch (e) {
        logWarnError(e)
        return []
      }
    })
  }

  protected getLikec4LibSymbol(astLib: ast.LikeC4Lib): DocumentSymbol[] {
    const cstModel = astLib?.$cstNode
    if (!cstModel) return []
    const children = astLib.icons.map(i => this.getLibIconSymbol(i)).filter(isTruthy)
    if (children.length === 0) return []
    return [
      {
        kind: SymbolKind.Namespace,
        name: 'icons',
        range: cstModel.range,
        selectionRange: GrammarUtils.findNodeForKeyword(cstModel, 'icons')?.range ?? cstModel.range,
        children,
      },
    ]
  }

  protected getSpecSymbol(astSpec: ast.SpecificationRule): DocumentSymbol[] {
    const cstModel = astSpec?.$cstNode
    if (!cstModel) return []
    const specKeywordNode = GrammarUtils.findNodeForProperty(cstModel, 'name')
    if (!specKeywordNode) return []

    const specSymbols = pipe(
      [...astSpec.elements, ...astSpec.tags, ...astSpec.relationships],
      map(nd => {
        try {
          if (
            ast.isSpecificationElementKind(nd) || ast.isSpecificationRelationshipKind(nd)
            || ast.isSpecificationDeploymentNodeKind(nd)
          ) {
            return this.getKindSymbol(nd)
          }
          if (ast.isSpecificationTag(nd)) {
            return this.getTagSymbol(nd)
          }
        } catch (e) {
          logWarnError(e)
          return null
        }
        nonexhaustive(nd)
      }),
      filter(isTruthy),
    )

    if (specSymbols.length === 0) return []

    return [
      {
        kind: SymbolKind.Namespace,
        name: astSpec.name,
        range: cstModel.range,
        selectionRange: specKeywordNode.range,
        children: specSymbols,
      },
    ]
  }

  protected getModelSymbol(astModel: ast.Model): DocumentSymbol[] {
    const cstModel = astModel.$cstNode
    if (!cstModel) return []
    const nameNode = GrammarUtils.findNodeForProperty(cstModel, 'name')
    if (!nameNode) return []
    return [
      {
        kind: this.symbolKind(astModel),
        name: astModel.name,
        range: cstModel.range,
        selectionRange: nameNode.range,
        children: astModel.elements.flatMap(e => this.getElementsSymbol(e)),
      },
    ]
  }

  protected getDeploymentModelSymbol(astModel: ast.ModelDeployments): DocumentSymbol[] {
    const cstModel = astModel.$cstNode
    if (!cstModel) return []
    const nameNode = GrammarUtils.findNodeForProperty(cstModel, 'name')
    if (!nameNode) return []
    return [
      {
        kind: this.symbolKind(astModel),
        name: astModel.name,
        range: cstModel.range,
        selectionRange: nameNode.range,
        children: astModel.elements.flatMap(e => this.getDeploymentElementSymbol(e)),
      },
    ]
  }

  protected getElementsSymbol(
    el: ast.Element | ast.Relation | ast.ExtendElement,
  ): DocumentSymbol[] {
    try {
      if (ast.isExtendElement(el)) {
        return this.getExtendElementSymbol(el)
      }
      if (ast.isElement(el)) {
        return this.getElementSymbol(el)
      }
    } catch (e) {
      logWarnError(e)
    }
    return []
  }

  protected getExtendElementSymbol(astElement: ast.ExtendElement): DocumentSymbol[] {
    const cst = astElement.$cstNode
    const nameNode = astElement.element.$cstNode
    const body = astElement.body
    if (!cst || !nameNode) return []

    return [
      {
        kind: this.symbolKind(astElement),
        name: readStrictFqn(astElement.element),
        range: cst.range,
        selectionRange: nameNode.range,
        children: body.elements.flatMap(e => this.getElementsSymbol(e)),
      },
    ]
  }

  protected getElementSymbol(astElement: ast.Element): DocumentSymbol[] {
    const cst = astElement.$cstNode
    const nameNode = GrammarUtils.findNodeForProperty(cst, 'name')
    if (!nameNode || !cst) return []

    const name = astElement.name
    const kind = astElement.kind.$refText
    // TODO: return the title as well
    const detail = kind // + (astElement.title ? ': ' + astElement.title : '').replaceAll('\n', ' ').trim()
    return [
      {
        kind: this.symbolKind(astElement),
        name: name,
        range: cst.range,
        selectionRange: nameNode.range,
        detail,
        children: astElement.body?.elements.flatMap(e => this.getElementsSymbol(e)) ?? [],
      },
    ]
  }
  protected getModelViewsSymbol(astViews: ast.ModelViews): DocumentSymbol[] {
    const cst = astViews.$cstNode
    const nameNode = GrammarUtils.findNodeForProperty(cst, 'name')
    if (!nameNode || !cst) return []
    return [
      {
        kind: this.symbolKind(astViews),
        name: astViews.name,
        range: cst.range,
        selectionRange: nameNode.range,
        children: astViews.views.flatMap(e => this.getViewSymbol(e)),
      },
    ]
  }

  protected getKindSymbol(
    astKind: ast.SpecificationElementKind | ast.SpecificationRelationshipKind,
  ): DocumentSymbol | null {
    if (!astKind.$cstNode || !astKind.kind.$cstNode || isEmpty(astKind.kind.name)) return null

    return {
      kind: this.symbolKind(astKind),
      name: astKind.kind.name,
      range: astKind.$cstNode.range,
      selectionRange: astKind.kind.$cstNode.range,
    }
  }

  protected getTagSymbol(astTag: ast.SpecificationTag): DocumentSymbol | null {
    if (!astTag.$cstNode || !astTag.tag.$cstNode || isEmpty(astTag.tag.name)) return null
    return {
      kind: this.symbolKind(astTag),
      name: '#' + astTag.tag.name,
      range: astTag.$cstNode.range,
      selectionRange: astTag.tag.$cstNode.range,
    }
  }

  protected getLibIconSymbol(astTag: ast.LibIcon): DocumentSymbol | null {
    if (!astTag.$cstNode || isEmpty(astTag.name)) return null
    return {
      kind: this.symbolKind(astTag),
      name: astTag.name,
      range: astTag.$cstNode.range,
      selectionRange: astTag.$cstNode.range,
    }
  }

  protected getViewSymbol(astView: ast.LikeC4View): DocumentSymbol[] {
    const cst = astView?.$cstNode
    if (!cst) return []
    const nameNode = astView.name ? GrammarUtils.findNodeForProperty(cst, 'name') : null
    if (!nameNode) return []
    return [
      {
        kind: this.symbolKind(astView),
        name: nameNode.text,
        range: cst.range,
        selectionRange: nameNode.range,
        children: [],
      },
    ]
  }

  protected getDeploymentElementSymbol(
    el: ast.DeploymentElement | ast.DeploymentRelation | ast.ExtendDeployment,
  ): DocumentSymbol[] {
    try {
      if (ast.isDeploymentNode(el)) {
        return this.getDeploymentNodeSymbol(el)
      }
      if (ast.isDeployedInstance(el)) {
        return this.getDeployedInstanceSymbol(el)
      }
      if (ast.isExtendDeployment(el)) {
        return []
      }
    } catch (e) {
      logWarnError(e)
    }
    return []
  }

  protected getDeploymentNodeSymbol(astElement: ast.DeploymentNode): DocumentSymbol[] {
    const cst = astElement.$cstNode
    const nameNode = this.nameProvider.getNameNode(astElement)
    if (!nameNode || !cst) return []

    const name = this.nameProvider.getNameStrict(astElement)
    const kind = astElement.kind.$refText
    // TODO: return the title as well
    const detail = kind // + (astElement.title ? ': ' + astElement.title : '').replaceAll('\n', ' ').trim()
    return [
      {
        kind: this.symbolKind(astElement),
        name: name,
        range: cst.range,
        selectionRange: nameNode.range,
        detail,
        children: astElement.body?.elements.flatMap(e => this.getDeploymentElementSymbol(e)) ?? [],
      },
    ]
  }

  protected getDeployedInstanceSymbol(astElement: ast.DeployedInstance): DocumentSymbol[] {
    const cst = astElement.$cstNode
    const nameNode = this.nameProvider.getNameNode(astElement)
    if (!nameNode || !cst) return []

    const doc = AstUtils.getDocument(astElement)
    const instance = this.parser.forDocument(doc).parseDeployedInstance(astElement)

    const name = this.nameProvider.getNameStrict(astElement)
    const detail = 'instance of ' + instance.element
    return [
      {
        kind: this.symbolKind(astElement),
        name: name,
        range: cst.range,
        selectionRange: nameNode.range,
        detail,
        children: [],
      },
    ]
  }

  protected symbolKind(node: AstNode): SymbolKind {
    return this.nodeKindProvider.getSymbolKind(node)
  }
}
