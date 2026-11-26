import { nonexhaustive } from '@likec4/core'
import type { AstNode, ValidationCheck } from 'langium'
import { isNumber, isString } from 'remeda'
import { ast, resolveDescriptionFile } from '../ast'
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
 * Whether the node carries a description of its own.
 *
 * A relation keeps its inline description in the header (`a -> b 'title' 'description'`) instead of a
 * `description` property of its body, so the conflict with `descriptionFile` is found one level up.
 */
function hasInlineDescription(node: AstNode | undefined): boolean {
  return !!node && 'description' in node && typeof node.description === 'string' &&
    node.description.trim() !== ''
}

/**
 * `descriptionFile` refers to a file: it is read here (and stays cached, see `LikeC4DescriptionFiles`),
 * so a file that cannot be read is reported on the property. The parser drops a reference that is
 * reported, and stays silent.
 */
export const descriptionFileRuleChecks = (
  services: LikeC4Services,
): ValidationCheck<ast.DescriptionFileProperty> => {
  // Services are created lazily: touching the service here makes sure it exists before the first
  // document is parsed, and tracks the references of every document
  const descriptionFiles = services.likec4.DescriptionFiles
  return tryOrLog(async (node, accept) => {
    const value = node.value?.trim()
    if (!value) {
      accept('error', `File name is empty`, { node, property: 'value' })
      return
    }

    const resolved = resolveDescriptionFile(node)
    if (!resolved) {
      accept('error', `File "${value}" cannot be resolved`, { node, property: 'value' })
      return
    }

    if (!services.shared.workspace.WorkspaceManager.isInsideWorkspace(resolved)) {
      accept('error', `File "${value}" is outside of the workspace`, { node, property: 'value' })
      return
    }

    const file = descriptionFiles.read(resolved)
    if (descriptionFiles.hasError(file)) {
      accept('error', file.content.error, { node, property: 'value' })
      return
    }

    if (file.content.md.trimEnd() === '') {
      accept('error', `File "${value}" is empty`, { node, property: 'value' })
      return
    }

    const container = node.$container
    const hasDescription = hasInlineDescription(container) || hasInlineDescription(container.$container) ||
      (container.props.some(p => ast.isStringProperty(p) && p.key === 'description'))
    if (hasDescription) {
      accept('error', `Only one of "description" and "descriptionFile" is allowed`, {
        node,
        property: 'key',
      })
      return
    }
  })
}
