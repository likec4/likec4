import { type ast } from '../ast'
import { logger } from '../logger'
import type { LikeC4Services } from '../module'
import { elementChecks } from './element'
import { relationChecks } from './relation'
import {
  elementKindChecks,
  modelRuleChecks,
  modelViewsChecks,
  relationshipChecks,
  specificationRuleChecks,
  tagChecks
} from './specification'
import { viewChecks } from './view'
import { incomingExpressionChecks, outgoingExpressionChecks } from './view-predicates'

export function registerValidationChecks(services: LikeC4Services) {
  logger.info('registerValidationChecks')
  const registry = services.validation.ValidationRegistry
  // const checks: ValidationChecks = {
  // Element: validator.checkElementNameDuplicates,
  // Tag: validator.checkTagDuplicates,
  // ElementKind: elementKindChecks(services),
  // ElementStyleProperty: validator.checkElementStyleProperty,
  // View: validator.checkViewNameDuplicates,
  // ColorStyleProperty: validator.checkColorStyleProperty,
  // }
  registry.register<ast.LikeC4AstType>(
    {
      SpecificationRule: specificationRuleChecks(services),
      Model: modelRuleChecks(services),
      ModelViews: modelViewsChecks(services),
      ElementView: viewChecks(services),
      Element: elementChecks(services),
      ElementKind: elementKindChecks(services),
      Relation: relationChecks(services),
      Tag: tagChecks(services),
      RelationshipKind: relationshipChecks(services),
      IncomingExpr: incomingExpressionChecks(services),
      OutgoingExpr: outgoingExpressionChecks(services)
    },
    'slow'
  )

  const connection = services.shared.lsp.Connection
  if (connection) {
    // workaround for bug in langium
    services.shared.workspace.DocumentBuilder.onUpdate((_, deleted) => {
      for (const uri of deleted) {
        void connection.sendDiagnostics({
          uri: uri.toString(),
          diagnostics: []
        })
      }
    })
  }
}
