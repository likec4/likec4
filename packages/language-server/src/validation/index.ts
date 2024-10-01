import { type ast } from '../ast'
import { logger } from '../logger'
import type { LikeC4Services } from '../module'
import { dynamicViewRulePredicate } from './dynamic-view-rule'
import { dynamicViewStep } from './dynamic-view-step'
import { elementChecks } from './element'
import { iconPropertyRuleChecks, notesPropertyRuleChecks, opacityPropertyRuleChecks } from './property-checks'
import { relationBodyChecks, relationChecks } from './relation'
import {
  elementKindChecks,
  globalRuleChecks,
  globalStyleChecks,
  modelRuleChecks,
  modelViewsChecks,
  relationshipChecks,
  specificationRuleChecks,
  tagChecks
} from './specification'
import { viewChecks } from './view'
import {
  elementPredicateWithChecks,
  expandElementExprChecks,
  incomingExpressionChecks,
  outgoingExpressionChecks,
  relationPredicateWithChecks
} from './view-predicates'

export function registerValidationChecks(services: LikeC4Services) {
  logger.info('registerValidationChecks')
  const registry = services.validation.ValidationRegistry
  registry.register<ast.LikeC4AstType>({
    NotesProperty: notesPropertyRuleChecks(services),
    OpacityProperty: opacityPropertyRuleChecks(services),
    IconProperty: iconPropertyRuleChecks(services),
    SpecificationRule: specificationRuleChecks(services),
    Model: modelRuleChecks(services),
    ModelViews: modelViewsChecks(services),
    GlobalRules: globalRuleChecks(services),
    GlobalStyle: globalStyleChecks(services),
    DynamicViewStep: dynamicViewStep(services),
    LikeC4View: viewChecks(services),
    Element: elementChecks(services),
    ElementKind: elementKindChecks(services),
    Relation: relationChecks(services),
    RelationBody: relationBodyChecks(services),
    Tag: tagChecks(services),
    DynamicViewPredicateIterator: dynamicViewRulePredicate(services),
    ElementPredicateWith: elementPredicateWithChecks(services),
    RelationPredicateWith: relationPredicateWithChecks(services),
    ExpandElementExpression: expandElementExprChecks(services),
    RelationshipKind: relationshipChecks(services),
    IncomingRelationExpression: incomingExpressionChecks(services),
    OutgoingRelationExpression: outgoingExpressionChecks(services)
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
