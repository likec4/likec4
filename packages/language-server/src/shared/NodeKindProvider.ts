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
    switch (true) {
      case isAstNode(node) ? ast.isElement(node) : node.type === ast.Element: {
        return CompletionItemKind.Variable
      }
      case isAstNode(node) ? ast.isElementKind(node) : node.type === ast.ElementKind: {
        return CompletionItemKind.Class
      }
    }
    return CompletionItemKind.Reference
  }
}
