import { type ValidationCheck, AstUtils } from 'langium'
import { ast } from '../../ast'
import type { LikeC4Services } from '../../module'
import { tryOrLog } from '../_shared'

const { getDocument } = AstUtils

export const checkElementConnectivity = (services: LikeC4Services): ValidationCheck<ast.Element> => {
  return tryOrLog((el, accept) => {
    // Skip user and external elements as they are often meant to be boundary elements
    const kindName = el.kind?.ref?.name
    if (kindName === 'user' || kindName === 'external') {
      return
    }

    const doc = getDocument(el)
    const grammar = doc.parseResult.value as ast.LikeC4Grammar

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
        if (ast.isRelation(statement)) {
          const relation = statement as ast.Relation

          // Check if this element is the source or target of any relation
          let sourceFqn: string | null = null
          let targetFqn: string | null = null

          // Get source FQN - check if relation has source
          if (relation.source && relation.source.value.ref && ast.isElement(relation.source.value.ref)) {
            sourceFqn = fqnIndex.getFqn(relation.source.value.ref)
          }

          // Get target FQN - target is required
          if (relation.target && relation.target.value.ref && ast.isElement(relation.target.value.ref)) {
            targetFqn = fqnIndex.getFqn(relation.target.value.ref)
          }

          // Check if this element matches the source or target
          if (
            (sourceFqn && sourceFqn === elementFqn) ||
            (targetFqn && targetFqn === elementFqn)
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
      // Use name since Element interface doesn't have title property
      const elementName = el.name || 'unknown'
      accept('warning', `Element '${elementName}' is not connected to any other elements`, {
        node: el,
        property: 'name',
        code: 'disconnected-element',
      })
    }
  })
}
