import { type ValidationCheck, AstUtils } from 'langium'
import type { ast } from '../ast'
import type { LikeC4Services } from '../module'
import { projectIdFrom } from '../utils'
import { RESERVED_WORDS, tryOrLog } from './_shared'

const { getDocument } = AstUtils

export const checkElement = (services: LikeC4Services): ValidationCheck<ast.Element> => {
  const fqnIndex = services.likec4.FqnIndex
  const locator = services.workspace.AstNodeLocator
  return tryOrLog((el, accept) => {
    const fqn = fqnIndex.getFqn(el)
    if (!fqn) {
      accept('error', 'Not indexed element', {
        node: el,
        property: 'name',
      })
      return
    }
    if (RESERVED_WORDS.includes(el.name)) {
      accept('error', `Reserved word: ${el.name}`, {
        node: el,
        property: 'name',
      })
    }
    const doc = getDocument(el)
    const docUri = doc.uri
    const elPath = locator.getAstNodePath(el)
    const withSameFqn = fqnIndex
      .byFqn(projectIdFrom(doc), fqn)
      .filter(v => v.documentUri !== docUri || v.path !== elPath)
      .head()
    if (withSameFqn) {
      const isAnotherDoc = withSameFqn.documentUri !== docUri
      accept(
        'error',
        `Duplicate element name ${el.name !== fqn ? el.name + ' (' + fqn + ')' : el.name}`,
        {
          node: el,
          property: 'name',
          ...isAnotherDoc && {
            relatedInformation: [
              {
                location: {
                  range: (withSameFqn.nameSegment?.range ?? withSameFqn.selectionSegment?.range)!,
                  uri: withSameFqn.documentUri.toString(),
                },
                message: `conflicting element`,
              },
            ],
          },
        },
      )
    }
  })
}

export const checkElementCorrectness = (services: LikeC4Services): ValidationCheck<ast.Element> => {
  return tryOrLog((el, accept) => {
    // Skip user and external elements as they are often meant to be boundary elements
    const kindName = el.kind?.ref?.name
    if (kindName === 'user' || kindName === 'external') {
      return
    }

    const doc = getDocument(el)
    const grammar = doc.parseResult.value

    if (!grammar || grammar.$type !== 'LikeC4Grammar') {
      return
    }

    // Get the element's fully qualified name
    const fqnIndex = services.likec4.FqnIndex
    const elementFqn = fqnIndex.getFqn(el)

    if (!elementFqn) {
      return
    }

    // Check if this element is connected to any other elements
    let isConnected = false

    // Search through all models in the grammar for relations
    for (const model of grammar.models) {
      if (!model.elements) continue

      // Look for relations in the model elements
      for (const statement of model.elements) {
        if (statement.$type === 'Relation') {
          const relation = statement as ast.Relation

          // Check if this element is the source or target of any relation
          // The source and target have a 'value' property that contains the actual reference
          let sourceFqn: string | null = null
          let targetFqn: string | null = null

          // Access source from the value property
          const sourceValue = (relation.source as any)?.value
          const targetValue = (relation.target as any)?.value

          if (sourceValue?.ref) {
            sourceFqn = fqnIndex.getFqn(sourceValue.ref)
          } else if (sourceValue?.$refText) {
            sourceFqn = sourceValue.$refText
          } else if (typeof sourceValue === 'string') {
            sourceFqn = sourceValue
          }

          if (targetValue?.ref) {
            targetFqn = fqnIndex.getFqn(targetValue.ref)
          } else if (targetValue?.$refText) {
            targetFqn = targetValue.$refText
          } else if (typeof targetValue === 'string') {
            targetFqn = targetValue
          }

          // Check if this element matches the source or target
          if (
            (sourceFqn && (sourceFqn === elementFqn || sourceFqn === el.name)) ||
            (targetFqn && (targetFqn === elementFqn || targetFqn === el.name))
          ) {
            isConnected = true
            break
          }
        }
      }

      if (isConnected) break
    }

    // If the element is not connected to anything, report it as disconnected
    if (!isConnected) {
      accept('warning', `Element '${el.title || el.name}' is not connected to any other elements`, {
        node: el,
        property: 'name',
        code: 'disconnected-element',
      })
    }
  })
}
