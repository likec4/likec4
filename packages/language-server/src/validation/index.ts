import type { AstNode } from 'langium'
import { isNullish } from 'remeda'
import { DiagnosticSeverity } from 'vscode-languageserver-types'
import { ast, type LikeC4AstNode, type LikeC4LangiumDocument } from '../ast'
import { logger } from '../logger'
import type { LikeC4Services } from '../module'
import { deployedInstanceChecks, deploymentNodeChecks, deploymentRelationChecks } from './deployment-checks'
import { dynamicViewRulePredicate } from './dynamic-view-rule'
import { dynamicViewStep } from './dynamic-view-step'
import { elementChecks } from './element'
import { iconPropertyRuleChecks, notesPropertyRuleChecks, opacityPropertyRuleChecks } from './property-checks'
import { relationBodyChecks, relationChecks } from './relation'
import {
  elementKindChecks,
  globalPredicateChecks,
  globalsChecks,
  globalStyleIdChecks,
  modelRuleChecks,
  relationshipChecks,
  specificationRuleChecks,
  tagChecks
} from './specification'
import { viewChecks } from './view'
import {
  elementPredicateWithChecks,
  expandElementExprChecks,
  fqnRefExprChecks,
  incomingExpressionChecks,
  outgoingExpressionChecks,
  relationExprChecks,
  relationPredicateWithChecks
} from './view-predicates'

type Guard<N extends AstNode> = (n: AstNode) => n is N
type Guarded<G> = G extends Guard<infer N> ? N : never

function validatableAstNodeGuards<const Predicates extends Guard<AstNode>[]>(
  predicates: Predicates
) {
  return (n: AstNode): n is Guarded<Predicates[number]> => predicates.some(p => p(n))
}
const isValidatableAstNode = validatableAstNodeGuards([
  ast.isGlobals,
  ast.isGlobalPredicateGroup,
  ast.isGlobalDynamicPredicateGroup,
  ast.isGlobalStyle,
  ast.isGlobalStyleGroup,
  ast.isDynamicViewPredicateIterator,
  ast.isElementPredicateWith,
  ast.isRelationPredicateWith,
  ast.isElementExpression,
  ast.isRelationExpression,
  ast.isDynamicViewParallelSteps,
  ast.isDynamicViewStep,
  ast.isDeploymentViewRule,
  ast.isDeploymentViewRulePredicate,
  ast.isExpressionV2,
  ast.isRelationExpr,
  ast.isFqnRefExpr,
  ast.isViewProperty,
  ast.isStyleProperty,
  ast.isPredicate,
  ast.isTags,
  ast.isViewRule,
  ast.isDynamicViewRule,
  ast.isLikeC4View,
  ast.isViewRuleStyleOrGlobalRef,
  ast.isDeployedInstance,
  ast.isDeploymentNode,
  ast.isRelationshipStyleProperty,
  ast.isRelation,
  ast.isElementProperty,
  ast.isStringProperty,
  ast.isNavigateToProperty,
  ast.isElement,
  ast.isExtendElement,
  ast.isSpecificationElementKind,
  ast.isSpecificationRelationshipKind,
  ast.isSpecificationDeploymentNodeKind,
  ast.isSpecificationTag,
  ast.isSpecificationColor,
  ast.isSpecificationRule
])
type ValidatableAstNode = Guarded<typeof isValidatableAstNode>

const findInvalidContainer = (node: LikeC4AstNode): ValidatableAstNode | undefined => {
  let nd = node as LikeC4AstNode['$container']
  while (nd) {
    if (isValidatableAstNode(nd)) {
      return nd
    }
    nd = nd.$container
  }
  return undefined
}

export function checksFromDiagnostics(doc: LikeC4LangiumDocument) {
  const errors = doc.diagnostics?.filter(d => d.severity === DiagnosticSeverity.Error) ?? []
  const invalidNodes = new WeakSet()
  for (const { node } of errors) {
    if (isNullish(node) || invalidNodes.has(node)) {
      continue
    }
    invalidNodes.add(node)
    const container = findInvalidContainer(node)
    if (container) {
      invalidNodes.add(container)
    }
  }
  const isValid = (n: ValidatableAstNode) => !invalidNodes.has(n)
  return {
    isValid,
    invalidNodes
  }
}
export type ChecksFromDiagnostics = ReturnType<typeof checksFromDiagnostics>
export type IsValidFn = ChecksFromDiagnostics['isValid']

export function registerValidationChecks(services: LikeC4Services) {
  logger.info('registerValidationChecks')
  const registry = services.validation.ValidationRegistry
  registry.register<ast.LikeC4AstType>({
    DeployedInstance: deployedInstanceChecks(services),
    DeploymentNode: deploymentNodeChecks(services),
    DeploymentRelation: deploymentRelationChecks(services),
    FqnRefExpr: fqnRefExprChecks(services),
    RelationExpr: relationExprChecks(services),
    NotesProperty: notesPropertyRuleChecks(services),
    OpacityProperty: opacityPropertyRuleChecks(services),
    IconProperty: iconPropertyRuleChecks(services),
    SpecificationRule: specificationRuleChecks(services),
    Model: modelRuleChecks(services),
    Globals: globalsChecks(services),
    GlobalPredicateGroup: globalPredicateChecks(services),
    GlobalDynamicPredicateGroup: globalPredicateChecks(services),
    GlobalStyleId: globalStyleIdChecks(services),
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
