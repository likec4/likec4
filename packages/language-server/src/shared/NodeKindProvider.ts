import { isAstNode, type AstNode, type AstNodeDescription } from 'langium'
import { CompletionItemKind, SymbolKind } from 'vscode-languageserver-protocol'
import { ast } from '../ast'

export class NodeKindProvider implements NodeKindProvider {
  /**
   * Returns a `SymbolKind` as used by `WorkspaceSymbolProvider` or `DocumentSymbolProvider`.
   */
  getSymbolKind(_node: AstNode | AstNodeDescription): SymbolKind {
    return SymbolKind.Field
  }
  /**
   * Returns a `CompletionItemKind` as used by the `CompletionProvider`.
   */
  getCompletionItemKind(node: AstNode | AstNodeDescription): CompletionItemKind {
    const hasType = (type: string) => 'type' in node && node.type === type
    switch (true) {
      case isAstNode(node) ? ast.isElement(node) : node.type === ast.Element: {
        return CompletionItemKind.Variable
      }
      case ast.isElementKind(node) ||
        ast.isRelationshipKind(node) ||
        hasType(ast.ElementKind) ||
        hasType(ast.RelationshipKind): {
        return CompletionItemKind.Class
      }
      case ast.isTag(node) || hasType(ast.Tag): {
        return CompletionItemKind.EnumMember
      }
    }
    return CompletionItemKind.Reference
  }
}
