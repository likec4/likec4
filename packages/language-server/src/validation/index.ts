import { onNextTick } from '@likec4/core/utils'
import { loggable } from '@likec4/log'
import { type AstNode, DocumentState } from 'langium'
import { isNullish } from 'remeda'
import { DiagnosticSeverity } from 'vscode-languageserver-types'
import { type LikeC4AstNode, type LikeC4LangiumDocument, ast } from '../ast'
import { logger } from '../logger'
import type { LikeC4Services } from '../module'
import {
  deployedInstanceChecks,
  deploymentNodeChecks,
  deploymentRelationChecks,
  extendDeploymentChecks,
} from './deployment-checks'
import { dynamicViewDisplayVariant, dynamicViewStepChain, dynamicViewStepSingle } from './dynamic-view'
import { checkElement } from './element'
import { checkElementRef } from './element-ref'
import { checkImportsFromPoject } from './imports'
import {
  colorLiteralRuleChecks,
  iconPropertyRuleChecks,
  notesPropertyRuleChecks,
  opacityPropertyRuleChecks,
} from './property-checks'
import { checkRelationBody, relationChecks } from './relation'
import {
  checkDeploymentNodeKind,
  checkElementKind,
  checkGlobalPredicate,
  checkGlobals,
  checkGlobalStyleId,
  checkModel,
  checkRelationshipKind,
  checkSpecificationRule,
  checkTag,
} from './specification'
import { viewChecks } from './view'
import {
  checkFqnExprWith,
  checkFqnRefExpr,
  checkIncomingRelationExpr,
  checkOutgoingRelationExpr,
  checkRelationExpr,
  checkRelationExprWith,
} from './view-predicates'

export { LikeC4DocumentValidator } from './DocumentValidator'

type Guard<N extends AstNode> = (n: AstNode) => n is N
type Guarded<G> = G extends Guard<infer N> ? N : never

function validatableAstNodeGuards<const Predicates extends Guard<AstNode>[]>(
  predicates: Predicates,
) {
  return (n: AstNode): n is Guarded<Predicates[number]> => predicates.some(p => p(n))
}
const isValidatableAstNode = validatableAstNodeGuards([
  ast.isImportsFromPoject,
  ast.isImported,
  ast.isGlobals,
  ast.isGlobalPredicateGroup,
  ast.isGlobalDynamicPredicateGroup,
  ast.isGlobalStyle,
  ast.isGlobalStyleGroup,
  ast.isFqnExprWith,
  ast.isRelationExprWith,
  ast.isFqnExpr,
  ast.isRelationExpr,
  ast.isDynamicViewParallelSteps,
  ast.isDynamicStepChain,
  ast.isDynamicStepSingle,
  ast.isDeploymentViewRule,
  ast.isDeploymentViewRulePredicate,
  ast.isExpressionV2,
  ast.isRelationExpr,
  ast.isFqnRefExpr,
  ast.isViewProperty,
  ast.isStyleProperty,
  ast.isTags,
  ast.isViewRule,
  ast.isDynamicViewRule,
  ast.isLikeC4View,
  ast.isViewRuleStyleOrGlobalRef,
  ast.isDeployedInstance,
  ast.isDeploymentNode,
  ast.isDeploymentRelation,
  ast.isRelationshipStyleProperty,
  ast.isDynamicViewDisplayVariantProperty,
  ast.isMetadataProperty,
  ast.isRelation,
  ast.isElementProperty,
  ast.isStringProperty,
  ast.isNavigateToProperty,
  ast.isElement,
  ast.isElementRef,
  ast.isExtendElement,
  ast.isExtendDeployment,
  ast.isSpecificationElementKind,
  ast.isSpecificationRelationshipKind,
  ast.isSpecificationDeploymentNodeKind,
  ast.isSpecificationTag,
  ast.isSpecificationColor,
  ast.isSpecificationRule,
  ast.isColorLiteral,
])
type ValidatableAstNode = Guarded<typeof isValidatableAstNode>

const findInvalidContainer = (node: LikeC4AstNode): ValidatableAstNode | undefined => {
  let nd = node as LikeC4AstNode['$container']
  while (nd && !ast.isLikeC4Grammar(nd)) {
    if (isValidatableAstNode(nd)) {
      return nd
    }
    nd = nd.$container
  }
  return undefined
}

export function checksFromDiagnostics(doc: LikeC4LangiumDocument) {
  const errors = doc.state >= DocumentState.Validated
    ? (doc.diagnostics?.filter(d => d.severity === DiagnosticSeverity.Error) ?? [])
    : []
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
    invalidNodes,
  }
}
export type ChecksFromDiagnostics = ReturnType<typeof checksFromDiagnostics>
export type IsValidFn = ChecksFromDiagnostics['isValid']

export function registerValidationChecks(services: LikeC4Services) {
  logger.debug('registerValidationChecks')
  const registry = services.validation.ValidationRegistry
  registry.register<ast.LikeC4AstType>({
    DeployedInstance: deployedInstanceChecks(services),
    DeploymentNodeKind: checkDeploymentNodeKind(services),
    DeploymentNode: deploymentNodeChecks(services),
    DeploymentRelation: deploymentRelationChecks(services),
    ExtendDeployment: extendDeploymentChecks(services),
    FqnRefExpr: checkFqnRefExpr(services),
    RelationExpr: checkRelationExpr(services),
    NotesProperty: notesPropertyRuleChecks(services),
    OpacityProperty: opacityPropertyRuleChecks(services),
    IconProperty: iconPropertyRuleChecks(services),
    SpecificationRule: checkSpecificationRule(services),
    Model: checkModel(services),
    Globals: checkGlobals(services),
    GlobalPredicateGroup: checkGlobalPredicate(services),
    GlobalDynamicPredicateGroup: checkGlobalPredicate(services),
    GlobalStyleId: checkGlobalStyleId(services),
    DynamicStepSingle: dynamicViewStepSingle(services),
    DynamicStepChain: dynamicViewStepChain(services),
    LikeC4View: viewChecks(services),
    Element: checkElement(services),
    ElementRef: checkElementRef(services),
    ElementKind: checkElementKind(services),
    Relation: relationChecks(services),
    RelationBody: checkRelationBody(services),
    Tag: checkTag(services),
    FqnExprWith: checkFqnExprWith(services),
    RelationExprWith: checkRelationExprWith(services),
    RelationshipKind: checkRelationshipKind(services),
    IncomingRelationExpr: checkIncomingRelationExpr(services),
    OutgoingRelationExpr: checkOutgoingRelationExpr(services),
    ImportsFromPoject: checkImportsFromPoject(services),
    // Imported: checkImported(services),
    ColorLiteral: colorLiteralRuleChecks(services),
    DynamicViewDisplayVariantProperty: dynamicViewDisplayVariant(services),
  })
  const connection = services.shared.lsp.Connection
  if (connection) {
    // delay initialization
    onNextTick(() => {
      // workaround for bug in langium
      services.shared.workspace.DocumentBuilder.onUpdate((_, deleted) => {
        for (const uri of deleted) {
          logger.debug(`clear diagnostics for deleted ${uri.path}`)
          connection.sendDiagnostics({
            uri: uri.toString(),
            diagnostics: [],
          }).catch(e => logger.error(loggable(e)))
        }
      })
    })
  }
}
