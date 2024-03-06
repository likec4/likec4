import { type Fqn, invariant, isAncestor, type NonEmptyArray, nonexhaustive } from '@likec4/core'
import { GrammarUtils } from 'langium'
import { findLast, last, partition } from 'remeda'
import { Location, Range, TextDocumentEdit, TextEdit } from 'vscode-languageserver-protocol'
import { ast, type ParsedAstElementView, type ParsedLikeC4LangiumDocument } from '../ast'
import type { FqnIndex, LikeC4ModelLocator } from '../model'
import type { LikeC4Services } from '../module'
import type { ChangeView } from '../protocol'

const { findNodeForKeyword } = GrammarUtils

const isViewRuleOfTarget = (fqn: string, index: FqnIndex) => (rule: ast.ViewRule): rule is ast.ViewRuleStyle => {
  if (!ast.isViewRuleStyle(rule)) {
    return false
  }
  const [target, ...rest] = rule.targets
  if (!target || rest.length > 0 || !ast.isElementRef(target)) {
    return false
  }
  const ref = target.el.ref
  const _fqn = ref ? index.getFqn(ref) : null
  return _fqn === fqn
}

type ChangeOp<T extends ChangeView.Operation> = T & {
  view: ParsedAstElementView
  doc: ParsedLikeC4LangiumDocument
  viewAst: ast.ElementView
}

type ChangeStyleProp = {
  view: ParsedAstElementView
  doc: ParsedLikeC4LangiumDocument
  viewAst: ast.ElementView
  key: string
  value: string
  targets: NonEmptyArray<Fqn>
}

export class LikeC4ViewsEditor {
  private locator: LikeC4ModelLocator

  constructor(private services: LikeC4Services) {
    this.locator = services.likec4.ModelLocator
  }

  public async applyChange(change: ChangeView.Operation): Promise<Location | null> {
    const lookup = this.locator.locateViewAst(change.viewId)
    if (!lookup) {
      throw new Error(`View not found: ${change.viewId}`)
    }
    switch (change.op) {
      case 'change-color': {
        return await this.changeStyleProp({
          ...lookup,
          targets: change.targets,
          key: 'color',
          value: change.color
        })
      }
      case 'change-shape':
        return await this.changeStyleProp({
          ...lookup,
          targets: change.targets,
          key: 'shape',
          value: change.shape
        })
      default:
        nonexhaustive(change)
    }
  }

  protected async changeStyleProp({
    doc,
    view,
    viewAst,
    targets,
    key,
    value
  }: ChangeStyleProp): Promise<Location | null> {
    const lspConnection = this.services.shared.lsp.Connection
    invariant(lspConnection, 'LSP Connection not available')
    const textDocument = {
      uri: doc.textDocument.uri,
      version: doc.textDocument.version
    }
    const viewCstNode = viewAst.$cstNode
    invariant(viewCstNode, 'viewCstNode')
    const insertPos = last(viewAst.body.rules)?.$cstNode?.range.end
      ?? last(viewAst.body.props)?.$cstNode?.range.end
      ?? viewAst.body.$cstNode?.range.start
    invariant(insertPos, 'insertPos is not defined')
    const indent = viewCstNode.range.start.character + 2
    const fqnIndex = this.services.likec4.FqnIndex
    const styleRules = viewAst.body.rules.filter(ast.isViewRuleStyle)
    const viewOf = view.viewOf
    // Find existing rules
    const targetsWithRules = targets.map(target => {
      const rule = findLast(styleRules, isViewRuleOfTarget(target, fqnIndex))
      const fqn = viewOf && isAncestor(viewOf, target) ? target.substring(viewOf.length + 1) : target
      if (rule) {
        return {
          fqn,
          rule
        }
      } else {
        return {
          fqn
        }
      }
    })

    const modifiedRange = {
      start: insertPos,
      end: insertPos
    }

    const includeRange = (range: Range) => {
      if (range.start.line < modifiedRange.start.line) {
        modifiedRange.start = range.start
      }
      if (range.end.line > modifiedRange.end.line) {
        modifiedRange.end = range.end
      }
    }

    // first find targets to insert
    const [existing, insert] = partition(
      targetsWithRules,
      (a): a is { fqn: Fqn; rule: ast.ViewRuleStyle } => !!a.rule
    )

    const edits = [] as TextEdit[]
    if (insert.length > 0) {
      const linesToInsert = [
        '',
        ...insert.map(({ fqn }) => this.colorStyleRule(fqn, key, value, indent))
      ]
      edits.push(
        TextEdit.insert(
          insertPos,
          linesToInsert.join('\n')
        )
      )
      modifiedRange.end = {
        line: modifiedRange.end.line + linesToInsert.length,
        character: last(linesToInsert)?.length ?? insertPos.character
      }
    }
    if (existing.length > 0) {
      for (const { rule } of existing) {
        const ruleCstNode = rule.$cstNode
        invariant(ruleCstNode, 'RuleCstNode not found')
        const ruleProp = rule.styleprops.find(p => p.key === key)
        // replace existing style property
        if (ruleProp && ruleProp.$cstNode) {
          const { start, end } = ruleProp.$cstNode.range
          includeRange(ruleProp.$cstNode.range)
          edits.push(TextEdit.replace({ start, end }, key + ' ' + value))
          continue
        }
        // insert new style property right after the opening brace
        const insertPos = findNodeForKeyword(ruleCstNode, '{')?.range.end
        invariant(insertPos, 'Opening brace not found')
        const indentStr = Array(2 + (ruleCstNode.range.start.character ?? 0)).fill(' ').join('')
        const insertKeyValue = indentStr + key + ' ' + value
        edits.push(
          TextEdit.insert(
            insertPos,
            '\n' + insertKeyValue
          )
        )
        includeRange({
          start: insertPos,
          end: {
            line: insertPos.line + 1,
            character: insertKeyValue.length
          }
        })
      }
    }
    if (!edits.length) {
      return null
    }
    const applyResult = await lspConnection.workspace.applyEdit({
      label: `LikeC4: change ${key} of ${targets.join(', ')} to ${value}`,
      edit: {
        documentChanges: [
          TextDocumentEdit.create(textDocument, edits)
        ]
      }
    })
    if (!applyResult.applied) {
      lspConnection.window.showErrorMessage(`Failed to apply changes${applyResult.failureReason}`)
      return null
    }
    return {
      uri: textDocument.uri,
      range: modifiedRange
    }
  }

  private colorStyleRule(target: string, key: string, value: string, indent = 0) {
    const indentStr = Array(indent).fill(' ').join('')
    return [
      `style ${target} {`,
      `  ${key} ${value}`,
      `}`
    ].map(s => indentStr + s).join('\n')
  }
}
