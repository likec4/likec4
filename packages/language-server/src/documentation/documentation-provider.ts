import { type Fqn, type ProjectId, FqnRef } from '@likec4/core'
import { type AstNode, AstUtils, DocumentState, JSDocDocumentationProvider } from 'langium'
import { ast } from '../ast'
import { logWarnError } from '../logger'
import type { LikeC4ModelLocator, LikeC4ModelParser } from '../model'
import type { LikeC4Services } from '../module'

/**
 * Provides documentation for LikeC4 AST nodes, extending JSDoc parsing
 * with specialized formatting for deployment nodes, deployed instances, and elements.
 */
export class LikeC4DocumentationProvider extends JSDocDocumentationProvider {
  private parser: LikeC4ModelParser
  private locator: LikeC4ModelLocator

  /**
   * Creates a new documentation provider.
   * @param services - The LikeC4 language services.
   */
  constructor(services: LikeC4Services) {
    super(services)
    this.parser = services.likec4.ModelParser
    this.locator = services.likec4.ModelLocator
  }

  /**
   * Returns documentation for the given AST node (deployment nodes, deployed instances, elements, or JSDoc fallback).
   * @param node - The AST node to document.
   * @returns Formatted documentation string, or undefined if none.
   */
  override getDocumentation(node: AstNode): string | undefined {
    if (!ast.isDeploymentNode(node) && !ast.isDeployedInstance(node) && !ast.isElement(node)) {
      return super.getDocumentation(node)
    }
    try {
      const doc = AstUtils.getDocument(node)
      if (doc.state < DocumentState.Linked) {
        // If the document is not yet linked, we cannot reliably parse it, so we fall back to JSDoc parsing.
        return super.getDocumentation(node)
      }

      const parser = this.parser.forDocument(doc)

      switch (true) {
        case ast.isDeploymentNode(node): {
          const el = parser.parseDeploymentNode(node)
          if (!el) return
          return `**${el.title}**`
        }
        case ast.isDeployedInstance(node): {
          const instance = parser.parseDeployedInstance(node)
          if (!instance) return
          const [projectId, fqn] = FqnRef.isImportRef(instance.element)
            ? [instance.element.project as ProjectId, instance.element.model as Fqn]
            : [doc.likec4ProjectId, instance.element.model as Fqn]
          const found = projectId ? this.locator.getParsedElement(fqn, projectId) : this.locator.getParsedElement(fqn)
          const lines = [
            `_instance of_ \`${fqn}\``,
          ]
          if (found) {
            lines.push(`**${found.element.title}**`)
          }
          return lines.join('  \n')
        }
        case ast.isElement(node): {
          const el = parser.parseElement(node)
          if (!el) {
            return
          }
          const lines = [
            `**${el.title}**`,
            `<small>kind: \`${el.kind}\`</small>`,
          ]
          return lines.join('  \n')
        }
        default: {
          // Exhaustiveness check — errors at compile time if guard admits a new node type without a handler
          const _exhaustive: never = node
          return _exhaustive
        }
      }
    } catch (e) {
      logWarnError(e)
    }
    return
  }
}
