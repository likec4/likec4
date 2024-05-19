import { type ast } from '../ast'
import { logger } from '../logger'
import type { LikeC4Services } from '../module'
import { elementChecks } from './element'
import { opacityPropertyRuleChecks } from './properties'
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
import {
  customElementExprChecks,
  expandElementExprChecks,
  incomingExpressionChecks,
  outgoingExpressionChecks
} from './view-predicates'

export function registerValidationChecks(services: LikeC4Services) {
  logger.info('registerValidationChecks')
  const registry = services.validation.ValidationRegistry
  registry.register<ast.LikeC4AstType>({
    OpacityProperty: opacityPropertyRuleChecks(services),
    SpecificationRule: specificationRuleChecks(services),
    Model: modelRuleChecks(services),
    ModelViews: modelViewsChecks(services),
    ElementView: viewChecks(services),
    Element: elementChecks(services),
    ElementKind: elementKindChecks(services),
    Relation: relationChecks(services),
    Tag: tagChecks(services),
    CustomElementExpr: customElementExprChecks(services),
    ExpandElementExpr: expandElementExprChecks(services),
    RelationshipKind: relationshipChecks(services),
    IncomingExpr: incomingExpressionChecks(services),
    OutgoingExpr: outgoingExpressionChecks(services)
  })
  const connection = services.shared.lsp.Connection
  if (connection) {
    // workaround for bug in langium
    services.shared.workspace.DocumentBuilder.onUpdate((_, deleted) => {
      for (const uri of deleted) {
        logger.debug(`clear diagnostics for deleted ${uri.path}`)
        void connection.sendDiagnostics({
          uri: uri.toString(),
          diagnostics: []
        })
      }
    })
  }
}
