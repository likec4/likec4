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
        ast.Element.$type,
        ast.ExtendElement.$type,
        ast.DeploymentNode.$type,
        ast.DeployedInstance.$type,
        ast.Imported.$type,
      ):
        return SymbolKind.Constructor

      case hasType(
        ast.Model.$type,
        ast.ModelViews.$type,
        ast.ModelDeployments.$type,
        ast.Globals.$type,
        ast.SpecificationRule.$type,
      ):
        return SymbolKind.Namespace

      case hasType(ast.LikeC4View.$type):
        return SymbolKind.Struct

      case hasType(
        ast.Tag.$type,
        ast.LibIcon.$type,
        ast.CustomColor.$type,
        ast.SpecificationTag.$type,
      ):
        return SymbolKind.EnumMember

      case hasType(
        ast.RelationshipKind.$type,
        ast.SpecificationRelationshipKind.$type,
      ):
        return SymbolKind.Event

      case hasType(
        ast.ElementKind.$type,
        ast.DeploymentNodeKind.$type,
        ast.SpecificationElementKind.$type,
        ast.SpecificationDeploymentNodeKind.$type,
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
        ast.CustomColor.$type,
      ):
        return CompletionItemKind.Color

      case hasType(
        ast.Element.$type,
        ast.DeploymentNode.$type,
        ast.DeployedInstance.$type,
        ast.ExtendElement.$type,
        ast.Imported.$type,
      ):
        return CompletionItemKind.Constructor

      case hasType(
        ast.Model.$type,
        ast.ModelViews.$type,
        ast.ModelDeployments.$type,
        ast.Globals.$type,
        ast.SpecificationRule.$type,
      ):
        return CompletionItemKind.Module

      case hasType(
        ast.LikeC4View.$type,
      ):
        return CompletionItemKind.Class

      case hasType(
        ast.Tag.$type,
        ast.LibIcon.$type,
        ast.CustomColor.$type,
        ast.SpecificationTag.$type,
      ):
        return CompletionItemKind.EnumMember

      case hasType(
        ast.RelationshipKind.$type,
        ast.SpecificationRelationshipKind.$type,
      ):
        return CompletionItemKind.Event

      case hasType(
        ast.ElementKind.$type,
        ast.SpecificationElementKind.$type,
        ast.DeploymentNodeKind.$type,
        ast.SpecificationDeploymentNodeKind.$type,
      ):
        return CompletionItemKind.TypeParameter

      default:
        return CompletionItemKind.Reference
    }
  }
}
