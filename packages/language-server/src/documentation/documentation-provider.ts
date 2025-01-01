import { type AstNode, type DocumentationProvider, AstUtils } from 'langium'
import { ast } from '../ast'
import { logWarnError } from '../logger'
import type { LikeC4ModelLocator, LikeC4ModelParser } from '../model'
import type { LikeC4Services } from '../module'

export class LikeC4DocumentationProvider implements DocumentationProvider {
  private parser: LikeC4ModelParser
  private locator: LikeC4ModelLocator

  constructor(services: LikeC4Services) {
    this.parser = services.likec4.ModelParser
    this.locator = services.likec4.ModelLocator
  }
  getDocumentation(node: AstNode): string | undefined {
    try {
      if (ast.isDeploymentNode(node)) {
        const doc = AstUtils.getDocument(node)
        const el = this.parser.forDocument(doc).parseDeploymentNode(node)
        const lines = [el.id as string]
        if (el.title !== node.name) {
          lines.push(' ', `**${el.title}**`)
        }
        return lines.join('  \n')
      }

      if (ast.isDeployedInstance(node)) {
        const doc = AstUtils.getDocument(node)
        const instance = this.parser.forDocument(doc).parseDeployedInstance(node)
        const el = this.locator.getParsedElement(instance.element)
        const lines = [instance.id, `_instance of_ ${instance.element}`]
        if (el) {
          lines.push(' ', `**${el.title}**`)
        }
        return lines.join('  \n')
      }

      if (ast.isElement(node)) {
        const doc = AstUtils.getDocument(node)
        const el = this.parser.forDocument(doc).parseElement(node)
        if (!el) {
          return
        }
        const lines = [el.id, ' ', `**${el.title}**`]
        return lines.join('  \n')
      }
    } catch (e) {
      logWarnError(e)
    }
    return
  }
}
