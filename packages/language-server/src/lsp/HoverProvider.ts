import { type Fqn, type ProjectId, FqnRef, preferSummary } from '@likec4/core'
import type { ElementModel, LikeC4ViewModel } from '@likec4/core/model'
import { loggable } from '@likec4/log'
import { type AstNode, type MaybePromise, AstUtils, URI } from 'langium'
import { AstNodeHoverProvider } from 'langium/lsp'
import { isNonNullish } from 'remeda'
import type { Hover } from 'vscode-languageserver-types'
import { ast } from '../ast'
import { logger } from '../logger'
import type { LikeC4ModelLocator, LikeC4ModelParser } from '../model'
import type { LikeC4Services } from '../module'

const HR = '\n---\n'

export class LikeC4HoverProvider extends AstNodeHoverProvider {
  private parser: LikeC4ModelParser
  private locator: LikeC4ModelLocator

  constructor(protected services: LikeC4Services) {
    super(services)
    this.parser = services.likec4.ModelParser
    this.locator = services.likec4.ModelLocator
  }

  protected getAstNodeHoverContent(node: AstNode): MaybePromise<Hover | undefined> {
    /// First, we try nodes that have a direct mapping to model elements, then we fall back to tags and keywords.
    if (ast.isTag(node)) {
      return {
        contents: {
          kind: 'markdown',
          value: 'tag `' + node.name + '`',
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

    if (ast.isRelationshipKind(node)) {
      return {
        contents: {
          kind: 'markdown',
          value: 'relationship kind `' + node.name + '`',
        },
      }
    }

    try {
      if (ast.isElement(node)) {
        return this.getElementHover(node)
      }

      if (ast.isDeploymentNode(node)) {
        return this.getDeploymentNodeHover(node)
      }

      if (ast.isDeployedInstance(node)) {
        return this.getDeployedInstanceHover(node)
      }
    } catch (e) {
      // ignore errors in hover provider to avoid breaking other features, and log them for debugging
      logger.debug(loggable(e))
    }

    return undefined
  }

  protected getElementHover(node: ast.Element): MaybePromise<Hover | undefined> {
    const found = this.locator.getParsedElement(node)
    if (!found) {
      return
    }
    const el = found.element
    const lines = [
      `<sup>\`${el.id}\`</sup>  `,
      `### ${el.title}  `,
    ]
    const summary = preferSummary(el)
    if (summary) {
      lines.push('', (summary.md ?? summary.txt).split('\n').join('  \n'))
    }

    const model = this.services.likec4.LastSeen.model(found.projectId)?.findElement(el.id)
    const details = model && this.getElementModelHover(model, found.projectId)
    lines.push(
      details || `\n<small>_Model not processed yet, open any view to trigger_</small>  `,
    )

    return {
      contents: {
        kind: 'markdown',
        value: lines.join('\n'),
      },
    }
  }

  protected getElementModelHover(model: ElementModel, projectId: ProjectId): string | undefined {
    const lines = []

    const incoming = [...model.incoming('direct')].length
    const outgoing = [...model.outgoing('direct')].length
    if (incoming > 0 || outgoing > 0) {
      lines.push(
        HR,
        `<small>**${incoming}** incoming, **${outgoing}** outgoing relationships</small> `,
      )
    }

    const printViewLink = (viewModel: LikeC4ViewModel) => {
      const params = [
        viewModel.id,
        projectId,
      ]
      const command = URI.parse(`command:likec4.open-preview?${encodeURIComponent(JSON.stringify(params))}`)
      return `  - [${viewModel.titleOrId}](${command})`
    }

    const scoped = [...model.scopedViews()].map(printViewLink)
    if (scoped.length > 0) {
      lines.push(
        HR,
        '<small>Element views:</small>',
        ...scoped,
      )
    }

    const views = [...model.views()].map(v => {
      if (v.isScopedElementView() && v.viewOf === model) {
        return null
      }
      return printViewLink(v)
    }).filter(isNonNullish)
    if (views.length > 0) {
      const title = scoped.length > 0 ? 'Also appears in views:' : 'Appears in views:'
      lines.push(
        scoped.length > 0 ? '' : HR,
        `<small>${title}</small>`,
        ...views,
        '  ',
      )
    }

    return lines.length > 0 ? lines.join('\n') : undefined
  }

  protected getDeploymentNodeHover(node: ast.DeploymentNode): MaybePromise<Hover | undefined> {
    const doc = AstUtils.getDocument(node)
    const el = this.parser.forDocument(doc).parseDeploymentNode(node)
    const lines = [el.id as string + '  ']
    if (el.title !== node.name) {
      lines.push(`### ${el.title}`)
    }
    lines.push('deployment node `' + el.kind + '` ')

    const summary = preferSummary(el)
    if (summary) {
      lines.push('', summary.md ?? summary.txt)
    }

    return {
      contents: {
        kind: 'markdown',
        value: lines.join('\n'),
      },
    }
  }

  protected getDeployedInstanceHover(node: ast.DeployedInstance): MaybePromise<Hover | undefined> {
    const doc = AstUtils.getDocument(node)
    const parser = this.parser.forDocument(doc)
    const instance = parser.parseDeployedInstance(node)
    const [projectId, fqn] = FqnRef.isImportRef(instance.element)
      ? [instance.element.project as ProjectId, instance.element.model as Fqn]
      : [doc.likec4ProjectId, instance.element.model as Fqn]
    const found = projectId ? this.locator.getParsedElement(fqn, projectId) : this.locator.getParsedElement(fqn)
    const lines = [instance.id + '  ', `instance of \`${FqnRef.flatten(instance.element)}\``]
    if (found) {
      lines.push(`### ${found.element.title}`, 'element kind `' + found.element.kind + '` ')
    }
    return {
      contents: {
        kind: 'markdown',
        value: lines.join('\n'),
      },
    }
  }
}
