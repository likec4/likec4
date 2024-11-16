import { type AstNode, type AstNodeDescription, isAstNode } from 'langium'
import type { LangiumSharedServices, NodeKindProvider as LspNodeKindProvider } from 'langium/lsp'
import { CompletionItemKind, SymbolKind } from 'vscode-languageserver-types'
import { ast } from '../ast'

export class NodeKindProvider implements LspNodeKindProvider {
  constructor(private services: LangiumSharedServices) {}

  /**
   * Returns a `SymbolKind` as used by `WorkspaceSymbolProvider` or `DocumentSymbolProvider`.
   */
  // prettier-ignore
  getSymbolKind(node: AstNode | AstNodeDescription): SymbolKind {
    const nodeType = isAstNode(node) ? node.$type : node.type
    const hasType = (...types: string[]) => types.some(t => this.services.AstReflection.isSubtype(nodeType, t))
    switch (true) {
      case hasType(
        ast.Element,
        ast.ExtendElement
      ):
        return SymbolKind.Constructor

      case hasType(
        ast.Model,
        ast.ModelViews,
        ast.ModelDeployments,
        ast.Globals,
        ast.SpecificationRule
      ):
        return SymbolKind.Namespace

      case hasType(ast.LikeC4View):
        return SymbolKind.Class

      case hasType(
        ast.Tag,
        ast.LibIcon,
        ast.CustomColor,
        ast.SpecificationTag
      ):
        return SymbolKind.EnumMember

      case hasType(
        ast.RelationshipKind,
        ast.SpecificationRelationshipKind
      ):
        return SymbolKind.Event

      case hasType(
        ast.ElementKind,
        ast.SpecificationElementKind
      ):
        return SymbolKind.TypeParameter
    }
    return SymbolKind.Field
  }
  /**
   * Returns a `CompletionItemKind` as used by the `CompletionProvider`.
   */
  getCompletionItemKind(node: AstNode | AstNodeDescription): CompletionItemKind {
    const nodeType = isAstNode(node) ? node.$type : node.type
    const hasType = (...types: string[]) => types.some(t => this.services.AstReflection.isSubtype(nodeType, t))
    switch (true) {
      case hasType(
        ast.CustomColor
      ):
        return CompletionItemKind.Color

      case hasType(
        ast.Element,
        ast.ExtendElement
      ):
        return CompletionItemKind.Constructor

      case hasType(
        ast.Model,
        ast.ModelViews,
        ast.ModelDeployments,
        ast.Globals,
        ast.SpecificationRule
      ):
        return CompletionItemKind.Module

      case hasType(
        ast.LikeC4View
      ):
        return CompletionItemKind.Class

      case hasType(
        ast.Tag,
        ast.LibIcon,
        ast.CustomColor,
        ast.SpecificationTag
      ):
        return CompletionItemKind.EnumMember

      case hasType(
        ast.RelationshipKind,
        ast.SpecificationRelationshipKind
      ):
        return CompletionItemKind.Event

      case hasType(
        ast.ElementKind,
        ast.SpecificationElementKind
      ):
        return CompletionItemKind.TypeParameter

      default:
        return CompletionItemKind.Reference
    }
  }
}
