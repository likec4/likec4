import { type AstNode, AstNodeHoverProvider, type MaybePromise } from 'langium'
import stripIndent from 'strip-indent'
import type { Hover } from 'vscode-languageserver'
import type { LikeC4Services } from '../module'
import type { LikeC4ModelLocator } from '../model'
import { ast } from '../ast'

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
      const lines = [el.id, `${el.kind}: **${el.title}**`]
      if (el.tags && el.tags.length > 0) {
        lines.push('  \n', el.tags.map(t => '#' + t).join(', '))
      }
      if (el.description) {
        lines.push('  \n', el.description)
      }
      return {
        contents: {
          kind: 'markdown',
          value: lines.join('  \n')
        }
      }
    }
    return
  }
}
