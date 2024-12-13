import { type AstNode, AstUtils, type MaybePromise } from 'langium'
import { AstNodeHoverProvider } from 'langium/lsp'
import { isTruthy } from 'remeda'
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
          value: stripIndent(`
            tag: \`${node.name}\`
          `)
        }
      }
    }

    if (ast.isDeploymentNode(node)) {
      const doc = AstUtils.getDocument(node)
      const el = this.parser.withDocument(doc).parseDeploymentNode(node)
      const lines = [el.id as string + '  ']
      if (el.title !== node.name) {
        lines.push(`### ${el.title}`)
      }
      lines.push('Deployment: `' + el.kind + '` ')
      return {
        contents: {
          kind: 'markdown',
          value: lines.join('\n')
        }
      }
    }

    if (ast.isDeployedInstance(node)) {
      const doc = AstUtils.getDocument(node)
      const instance = this.parser.withDocument(doc).parseDeployedInstance(node)
      const el = this.locator.getParsedElement(instance.element)
      const lines = [instance.id + '  ', `instance of \`${instance.element}\``]
      if (el) {
        lines.push(`### ${el.title}`, 'Element: `' + el.kind + '` ')
      }
      return {
        contents: {
          kind: 'markdown',
          value: lines.join('\n')
        }
      }
    }

    // if (ast.isElementKind(node)) {
    //   const spec = this.specIndex.get(node.name as ElementKind)
    //   return {
    //     contents: {
    //       kind: 'markdown',
    //       value: stripIndent(`
    //         kind: **${spec.id}**
    //         shape: ${spec.style.shape}
    //       `)
    //     }
    //   }
    // }

    if (ast.isElement(node)) {
      const el = this.locator.getParsedElement(node)
      if (!el) {
        return
      }
      const lines = [el.id, `### ${el.title}`, 'Element: `' + el.kind + '` ']
      return {
        contents: {
          kind: 'markdown',
          value: lines.join('\n')
        }
      }
    }
    return
  }
}
