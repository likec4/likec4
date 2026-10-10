import { nonexhaustive } from '@likec4/core'
import { type ValidationCheck, AstUtils } from 'langium'
import { isNumber, isString } from 'remeda'
import { ast, parseMarkdownAsString } from '../ast'
import type { LikeC4Services } from '../module'
import { tryOrLog } from './_shared'

export const opacityPropertyRuleChecks = (
  _: LikeC4Services,
): ValidationCheck<ast.OpacityProperty> => {
  return tryOrLog((node, accept) => {
    const opacity = parseFloat(node.value)
    if (isNaN(opacity) || opacity < 0 || opacity > 100) {
      accept('warning', `Value ignored, must be between 0% and 100%`, {
        node,
        property: 'value',
      })
    }
  })
}

export const iconPropertyRuleChecks = (
  _: LikeC4Services,
): ValidationCheck<ast.IconProperty> => {
  return (node, accept) => {
    const container = node.$container
    const anotherIcon = container.props.some(p => ast.isIconProperty(p) && p !== node)
    if (anotherIcon) {
      accept('error', `Icon must be defined once`, {
        node,
      })
    }
    if (
      ast.isElementStyleProperty(container) && ast.isElementBody(container.$container)
      && container.$container.props.some(p => ast.isIconProperty(p))
    ) {
      accept('warning', `Redundant as icon defined on element`, {
        node,
      })
    }

    if (node.value?.startsWith('file://')) {
      accept('error', `Icon URI must not start with file://`, {
        node,
        property: 'value',
      })
    }
  }
}

export const colorLiteralRuleChecks = (_: LikeC4Services): ValidationCheck<ast.ColorLiteral> => {
  return (node, accept) => {
    if (node.$type === 'HexColor') {
      if (node.hex === undefined || (isString(node.hex) && !node.hex.match(/^[a-fA-F0-9]+$/))) {
        accept('error', `Invalid HEX`, {
          node,
          property: 'hex',
        })
        return
      }
      const length = isNumber(node.hex) ? node.hex.toString().length : node.hex.length
      if (length !== 6 && length !== 3 && length !== 8) {
        accept('error', `Invalid value "${node.$cstNode?.text}", must be 3, 6 or 8 characters long`, {
          node,
          property: 'hex',
        })
      }
      return
    }
    if (node.$type === 'RGBAColor') {
      if (!isNumber(node.red) || node.red < 0 || node.red > 255) {
        accept('error', `Invalid value, must be between 0 and 255`, {
          node,
          property: 'red',
        })
      }
      if (!isNumber(node.green) || node.green < 0 || node.green > 255) {
        accept('error', `Invalid value, must be between 0 and 255`, {
          node,
          property: 'green',
        })
      }
      if (!isNumber(node.blue) || node.blue < 0 || node.blue > 255) {
        accept('error', `Invalid value, must be between 0 and 255`, {
          node,
          property: 'blue',
        })
      }
      if (isNumber(node.alpha)) {
        if (node.alpha < 0 || node.alpha > 1) {
          accept('error', `Invalid value, must be between 0 and 1`, {
            node,
            property: 'alpha',
          })
        }
      }
      if (isString(node.alpha)) {
        const alpha = parseFloat(node.alpha)
        if (alpha < 0 || alpha > 100) {
          accept('error', `Invalid value, must be between 0% and 100%`, {
            node,
            property: 'alpha',
          })
        }
      }
      return
    }
    nonexhaustive(node)
  }
}

/**
 * `descriptionFile` refers to a file that is read before the model is parsed, so a file that could
 * not be read has to be reported here (the parser has nothing to describe, and stays silent).
 */
export const descriptionFileRuleChecks = (
  services: LikeC4Services,
): ValidationCheck<ast.StringProperty> => {
  // The referenced files are read on the `Parsed` document phase, and services are created lazily:
  // touching the service here makes sure it exists before the first document is parsed
  const descriptionFiles = services.shared.workspace.DescriptionFiles
  return tryOrLog(async (node, accept) => {
    if (node.key !== 'descriptionFile') {
      return
    }
    const container = node.$container
    if (
      'props' in container && Array.isArray(container.props)
      && container.props.some(p => ast.isStringProperty(p) && p !== node && p.key === 'description')
    ) {
      accept('error', `Only one of "description" and "descriptionFile" is allowed`, {
        node,
        property: 'key',
      })
      return
    }
    const value = node.value
    const path = ast.isMarkdownOrString(value) ? parseMarkdownAsString(value) : undefined
    if (!path) {
      accept('error', `File name is empty`, { node, property: 'value' })
      return
    }
    const doc = AstUtils.getDocument(node)
    const result = descriptionFiles.get(doc.uri, path) ?? await descriptionFiles.readFile(doc, path)
    if ('error' in result) {
      accept('error', result.error, { node, property: 'value' })
    }
  })
}
