import { type AstNode, type MaybePromise } from 'langium'
import { AstNodeHoverProvider } from 'langium/lsp'
import { isTruthy } from 'remeda'
import stripIndent from 'strip-indent'
import type { Hover } from 'vscode-languageserver-types'
import { ast } from '../ast'
import type { LikeC4ModelLocator } from '../model'
import type { LikeC4Services } from '../module'

export class LikeC4HoverProvider extends AstNodeHoverProvider {
  private locator: LikeC4ModelLocator

  constructor(services: LikeC4Services) {
    super(services)
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
      const lines = [el.id, `### ${el.title}`, '`' + el.kind + '` ']
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
