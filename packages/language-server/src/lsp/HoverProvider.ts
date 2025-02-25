import { type AstNode, type MaybePromise, AstUtils } from 'langium'
import { AstNodeHoverProvider } from 'langium/lsp'
import stripIndent from 'strip-indent'
import type { Hover } from 'vscode-languageserver-types'
import { ast } from '../ast'
import type { LikeC4ModelLocator, LikeC4ModelParser } from '../model'
import type { LikeC4Services } from '../module'

export class LikeC4HoverProvider extends AstNodeHoverProvider {
  private parser: LikeC4ModelParser
  private locator: LikeC4ModelLocator

  constructor(services: LikeC4Services) {
    super(services)
    this.parser = services.likec4.ModelParser
    this.locator = services.likec4.ModelLocator
  }

  protected getAstNodeHoverContent(node: AstNode): MaybePromise<Hover | undefined> {
    if (ast.isTag(node)) {
      return {
        contents: {
          kind: 'markdown',
          value: 'tag `' + node.name + '`',
        },
      }
    }

    if (ast.isDeploymentNode(node)) {
      const doc = AstUtils.getDocument(node)
      const el = this.parser.forDocument(doc).parseDeploymentNode(node)
      const lines = [el.id as string + '  ']
      if (el.title !== node.name) {
        lines.push(`### ${el.title}`)
      }
      lines.push('deployment node `' + el.kind + '` ')
      return {
        contents: {
          kind: 'markdown',
          value: lines.join('\n'),
        },
      }
    }

    if (ast.isDeployedInstance(node)) {
      const doc = AstUtils.getDocument(node)
      const instance = this.parser.forDocument(doc).parseDeployedInstance(node)
      const el = this.locator.getParsedElement(instance.element)
      const lines = [instance.id + '  ', `instance of \`${instance.element}\``]
      if (el) {
        lines.push(`### ${el.title}`, 'element kind `' + el.kind + '` ')
      }
      return {
        contents: {
          kind: 'markdown',
          value: lines.join('\n'),
        },
      }
    }

    if (ast.isElementKind(node)) {
      return {
        contents: {
          kind: 'markdown',
          value: 'element kind `' + node.name + '`',
        },
      }
    }

    if (ast.isDeploymentNodeKind(node)) {
      return {
        contents: {
          kind: 'markdown',
          value: 'deployment node `' + node.name + '`',
        },
      }
    }

    if (ast.isElement(node)) {
      const el = this.locator.getParsedElement(node)
      if (!el) {
        return
      }
      const lines = [el.id, `### ${el.title}`, 'element kind `' + el.kind + '` ']
      return {
        contents: {
          kind: 'markdown',
          value: lines.join('\n'),
        },
      }
    }
    return
  }
}
