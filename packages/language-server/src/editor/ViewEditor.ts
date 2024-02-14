import {
  type ElementView,
  type Fqn,
  invariant,
  isAncestor,
  type NonEmptyArray,
  nonexhaustive,
  nonNullable,
  type ThemeColor
} from '@likec4/core'
import {
  type AstNode,
  type AstNodeDescription,
  findNodeForKeyword,
  findNodeForProperty,
  type LangiumSharedServices,
  RangeComparison
} from 'langium'
import { nanoid } from 'nanoid'
import { findLast, hasAtLeast, isTruthy, last, partition } from 'remeda'
import stripIndent from 'strip-indent'
import type { Connection, Location } from 'vscode-languageserver'
import {
  AnnotatedTextEdit,
  ChangeAnnotation,
  CompletionItemKind,
  SymbolKind,
  TextDocumentEdit,
  TextEdit
} from 'vscode-languageserver-protocol'
import { ast, type ParsedAstElementView, type ParsedLikeC4LangiumDocument } from '../ast'
import { logger } from '../logger'
import type { FqnIndex, LikeC4ModelLocator } from '../model'
import type { LikeC4Services } from '../module'
import type { ChangeView } from '../protocol'

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

export class ViewEditor {
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

  protected async changeColor({
    doc,
    view,
    viewAst,
    targets,
    color,
    viewId
  }: ChangeOp<ChangeView.ChangeColor>): Promise<Location | null> {
    const workspace = this.services.shared.lsp.Connection?.workspace
    invariant(workspace, 'vscode workspace not available')
    const textDocument = {
      uri: doc.textDocument.uri,
      version: doc.textDocument.version
    }
    const viewCstNode = viewAst.$cstNode
    invariant(viewCstNode, 'viewCstNode')
    const insertPos = last(viewAst.body.rules)?.$cstNode?.range.end
      ?? last(viewAst.body.props)?.$cstNode?.range.end
      ?? viewAst.body.$cstNode?.range.start

    // findNodeForKeyword(viewCstNode, '}')?.range.start
    // ?? viewAst.body.$cstNode?.range.end
    // ?? last(viewAst.body.rules)?.$cstNode?.range.end
    // ?? last(viewAst.body.props)?.$cstNode?.range.end
    // ?? last(viewAst.body.tags?.value ?? [])?.$refNode?.range.end
    // ?? viewAst.body.$cstNode?.range.end

    invariant(insertPos, 'insertPos is not defined')
    // // invariant(hasAtLeast(viewAst.body.rules, 1), `empty viewAst.body.rules ${viewId}`)
    // const lastRuleNode = last<AstNode>(viewAst.body.rules)
    const indent = viewCstNode.range.start.character + 2

    //   viewAst.body.rules.length > 0 ? viewAst.body.rules : [
    //     viewAst.body,
    //     ...viewAst.body.props
    //   ]
    // )?.$cstNode?.range
    // if (!lastAstNode) {
    //   throw new Error('No rule found')
    // }
    // const indent = lastAstNode.start.character

    const index = this.services.likec4.FqnIndex
    const styleRules = viewAst.body.rules.filter(ast.isViewRuleStyle)
    const viewOf = view.viewOf
    // Find existing rules
    const targetsWithRules = targets.map(target => {
      const rule = findLast(styleRules, isViewRuleOfTarget(target, index))
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

    // first find targets to insert
    const [existing, insert] = partition(
      targetsWithRules,
      (a): a is { fqn: Fqn; rule: ast.ViewRuleStyle } => !!a.rule
    )

    const edits = [] as TextEdit[]
    if (insert.length > 0) {
      edits.push(
        TextEdit.insert(
          insertPos,
          [
            '',
            ...insert.map(({ fqn }) => this.colorStyleRule(fqn, 'color', color, indent))
          ].join('\n')
        )
      )
    }
    if (existing.length > 0) {
      for (const { rule } of existing) {
        const ruleProp = rule.styleprops.find(p => p.key === 'color')
        if (ruleProp) {
          invariant(ruleProp.$cstNode, 'ruleProp.$cstNode')
          const start = ruleProp.$cstNode.range.start
          const end = ruleProp.$cstNode.range.end
          edits.push(
            TextEdit.replace({ start, end }, 'color ' + color)
          )
          continue
        }
        const insertPos = findNodeForKeyword(rule.$cstNode, '{')?.range.end
        if (!insertPos) {
          logger.warn('No insertPos found')
          continue
        }
        const indentstr = Array(2 + (rule.$cstNode?.range.start.character ?? 0)).fill(' ').join('')
        edits.push(
          TextEdit.insert(
            insertPos,
            [
              '',
              indentstr + 'color ' + color
            ].join('\n')
          )
        )
      }
    }
    if (!edits.length) {
      return null
    }
    await workspace.applyEdit({
      label: `LikeC4: change color of ${targets.join(', ')}`,
      edit: {
        documentChanges: [
          TextDocumentEdit.create(textDocument, edits)
        ]
      }
    })
    return {
      uri: textDocument.uri,
      range: viewCstNode.range
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
    const workspace = this.services.shared.lsp.Connection?.workspace
    invariant(workspace, 'vscode workspace not available')
    const textDocument = {
      uri: doc.textDocument.uri,
      version: doc.textDocument.version
    }
    const viewCstNode = viewAst.$cstNode
    invariant(viewCstNode, 'viewCstNode')
    const insertPos = last(viewAst.body.rules)?.$cstNode?.range.end
      ?? last(viewAst.body.props)?.$cstNode?.range.end
      ?? viewAst.body.$cstNode?.range.start

    // findNodeForKeyword(viewCstNode, '}')?.range.start
    // ?? viewAst.body.$cstNode?.range.end
    // ?? last(viewAst.body.rules)?.$cstNode?.range.end
    // ?? last(viewAst.body.props)?.$cstNode?.range.end
    // ?? last(viewAst.body.tags?.value ?? [])?.$refNode?.range.end
    // ?? viewAst.body.$cstNode?.range.end

    invariant(insertPos, 'insertPos is not defined')
    // // invariant(hasAtLeast(viewAst.body.rules, 1), `empty viewAst.body.rules ${viewId}`)
    // const lastRuleNode = last<AstNode>(viewAst.body.rules)
    const indent = viewCstNode.range.start.character + 2

    //   viewAst.body.rules.length > 0 ? viewAst.body.rules : [
    //     viewAst.body,
    //     ...viewAst.body.props
    //   ]
    // )?.$cstNode?.range
    // if (!lastAstNode) {
    //   throw new Error('No rule found')
    // }
    // const indent = lastAstNode.start.character

    const index = this.services.likec4.FqnIndex
    const styleRules = viewAst.body.rules.filter(ast.isViewRuleStyle)
    const viewOf = view.viewOf
    // Find existing rules
    const targetsWithRules = targets.map(target => {
      const rule = findLast(styleRules, isViewRuleOfTarget(target, index))
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

    // first find targets to insert
    const [existing, insert] = partition(
      targetsWithRules,
      (a): a is { fqn: Fqn; rule: ast.ViewRuleStyle } => !!a.rule
    )

    const edits = [] as TextEdit[]
    if (insert.length > 0) {
      edits.push(
        TextEdit.insert(
          insertPos,
          [
            '',
            ...insert.map(({ fqn }) => this.colorStyleRule(fqn, key, value, indent))
          ].join('\n')
        )
      )
    }
    if (existing.length > 0) {
      for (const { rule } of existing) {
        const ruleProp = rule.styleprops.find(p => p.key === key)
        if (ruleProp) {
          invariant(ruleProp.$cstNode, 'ruleProp.$cstNode')
          const start = ruleProp.$cstNode.range.start
          const end = ruleProp.$cstNode.range.end
          edits.push(
            TextEdit.replace({ start, end }, key + ' ' + value)
          )
          continue
        }
        const insertPos = findNodeForKeyword(rule.$cstNode, '{')?.range.end
        if (!insertPos) {
          logger.warn('No insertPos found')
          continue
        }
        const indentstr = Array(2 + (rule.$cstNode?.range.start.character ?? 0)).fill(' ').join('')
        edits.push(
          TextEdit.insert(
            insertPos,
            [
              '',
              indentstr + key + ' ' + value
            ].join('\n')
          )
        )
      }
    }
    if (!edits.length) {
      return null
    }
    await workspace.applyEdit({
      label: `LikeC4: change ${key} of ${targets.join(', ')} to ${value}`,
      edit: {
        documentChanges: [
          TextDocumentEdit.create(textDocument, edits)
        ]
      }
    })
    return {
      uri: textDocument.uri,
      range: viewCstNode.range
    }
  }

  private colorStyleRule(target: string, key: string, value: string, indent = 0) {
    const indentstr = Array(indent).fill(' ').join('')
    return [
      `style ${target} {`,
      `  ${key} ${value}`,
      `}`
    ].map(s => indentstr + s).join('\n')
  }

  private changeStyleRuleColor(rule: ast.ViewRuleStyle, color: ThemeColor) {
    invariant(rule.$cstNode, 'rule.$cstNode')
    const indentstr = Array(rule.$cstNode.range.start.character).fill(' ').join('')
    const target = nonNullable(rule.targets[0]?.$cstNode).text
    const styleprops = rule.styleprops.map(p => {
      return p.key + ' ' + (p.key === 'color' ? color : p.value)
    })
    if (styleprops.length === 0) {
      styleprops.push('color ' + color)
    }
    return [
      `style ${target} {`,
      ...styleprops.map(p => '  ' + p),
      `}`
    ].map(s => indentstr + s).join('\n')
  }
}
