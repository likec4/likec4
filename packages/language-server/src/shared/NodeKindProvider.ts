import { type AstNode, type AstNodeDescription } from 'langium'
import type { LangiumSharedServices, NodeKindProvider as LspNodeKindProvider } from 'langium/lsp'
import { CompletionItemKind, SymbolKind } from 'vscode-languageserver-protocol'
import { ast } from '../ast'

export class NodeKindProvider implements LspNodeKindProvider {
  constructor(private services: LangiumSharedServices) {}

  /**
   * Returns a `SymbolKind` as used by `WorkspaceSymbolProvider` or `DocumentSymbolProvider`.
   */
  // prettier-ignore
  getSymbolKind(node: AstNode | AstNodeDescription): SymbolKind {
    const hasType = (type: string) => 'type' in node && this.services.AstReflection.isSubtype(node.type, type)
    switch (true) {
      case (ast.isElement(node) || hasType(ast.Element))
        || (ast.isExtendElement(node) || hasType(ast.ExtendElement)): {
        return SymbolKind.Constructor
      }
      case ast.isModel(node) || ast.isModelViews(node) || ast.isSpecificationRule(node)
        || hasType(ast.Model) || hasType(ast.ModelViews) || hasType(ast.SpecificationRule): {
        return SymbolKind.Namespace
      }
      case (ast.isLikeC4View(node) || hasType(ast.LikeC4View)): {
        return SymbolKind.Class
      }
      case (ast.isTag(node) || hasType(ast.Tag))
        || (ast.isLibIcon(node) || hasType(ast.LibIcon))
        || (ast.isSpecificationTag(node) || hasType(ast.SpecificationTag)): {
        return SymbolKind.EnumMember
      }
      case (ast.isRelationshipKind(node) || hasType(ast.RelationshipKind))
        || (ast.isSpecificationRelationshipKind(node) || hasType(ast.SpecificationRelationshipKind)): {
        return SymbolKind.Event
      }
      case (ast.isElementKind(node) || hasType(ast.ElementKind))
        || (ast.isSpecificationElementKind(node) || hasType(ast.SpecificationElementKind)): {
        return SymbolKind.TypeParameter
      }
    }
    return SymbolKind.Constant
  }
  /**
   * Returns a `CompletionItemKind` as used by the `CompletionProvider`.
   */
  getCompletionItemKind(node: AstNode | AstNodeDescription): CompletionItemKind {
    switch (this.getSymbolKind(node)) {
      case SymbolKind.Constructor:
        return CompletionItemKind.Constructor
      case SymbolKind.Namespace:
        return CompletionItemKind.Module
      case SymbolKind.Class:
        return CompletionItemKind.Class
      case SymbolKind.Enum:
        return CompletionItemKind.Enum
      case SymbolKind.EnumMember:
        return CompletionItemKind.EnumMember
      case SymbolKind.TypeParameter:
        return CompletionItemKind.TypeParameter
      case SymbolKind.Interface:
        return CompletionItemKind.Interface
      case SymbolKind.Event:
        return CompletionItemKind.Event
      default:
        return CompletionItemKind.Reference
    }
  }
}
