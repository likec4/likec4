export type {
  CustomColor,
  ExclusiveUnion,
  IconUrl,
  IteratorLike,
  KeysOf,
  NonEmptyArray,
  NonEmptyReadonlyArray,
  NTuple,
  Point,
  Predicate,
  XYPoint,
} from './_common'

export { DeploymentElement } from './deployments'
export type {
  DeployedInstance,
  DeploymentElementStyle,
  DeploymentNode,
  DeploymentNodeKind,
  DeploymentNodeKindSpecification,
  DeploymentRef,
  DeploymentRelation,
  PredicateSelector,
} from './deployments'

export {
  AsFqn,
  BorderStyles,
  DefaultElementShape,
  DefaultThemeColor,
  ElementKind,
  ElementShapes,
} from './element'
export type {
  BorderStyle,
  Element,
  ElementKindSpecification,
  ElementKindSpecificationStyle,
  ElementShape,
  ElementStyle,
  Fqn,
  Link,
  Tag,
  TagSpec,
  TypedElement,
} from './element'

export {
  isCustomElement,
  isCustomRelationExpr,
  isElement,
  isElementKindExpr,
  isElementPredicateExpr,
  isElementRef,
  isElementTagExpr,
  isElementWhere,
  isExpandedElementExpr,
  isIncoming,
  isInOut,
  isOutgoing,
  isRelation,
  isRelationExpression,
  isRelationPredicateExpr,
  isRelationWhere,
  isWildcard,
} from './expression'
export type {
  CustomElementExpr,
  CustomRelationExpr,
  DirectRelationExpr,
  ElementExpression,
  ElementKindExpr,
  ElementPredicateExpression,
  ElementRefExpr,
  ElementTagExpr,
  ElementWhereExpr,
  ExpandedElementExpr,
  Expression,
  IncomingExpr,
  InOutExpr,
  NonWilcard,
  OutgoingExpr,
  RelationExpression,
  RelationPredicateExpression,
  RelationWhereExpr,
  WildcardExpr,
} from './expression'

export { ExpressionV2, FqnExpr, FqnRef, RelationExpr } from './expression-v2'

export type {
  GlobalDynamicPredicates,
  GlobalPredicateId,
  GlobalPredicates,
  GlobalStyleID,
  GlobalStyles,
  ModelGlobals,
} from './global'

export type {
  AnyParsedLikeC4Model,
  ComputedLikeC4Model,
  GenericLikeC4Model,
  LayoutedLikeC4Model,
  LikeC4ModelDump,
  ParsedLikeC4Model,
} from './model'

export {
  isAndOperator,
  isKindEqual,
  isNotOperator,
  isOrOperator,
  isTagEqual,
  whereOperatorAsPredicate,
} from './operators'
export type {
  AndOperator,
  EqualOperator,
  Filterable,
  KindEqual,
  NotOperator,
  OperatorPredicate,
  OrOperator,
  TagEqual,
  WhereOperator,
} from './operators'
export type { OverviewGraph } from './overview-graph'
export { DefaultArrowType, DefaultLineStyle, DefaultRelationshipColor } from './relation'
export type {
  AbstractRelation,
  ModelRelation,
  RelationId,
  RelationshipArrowType,
  RelationshipKind,
  RelationshipKindSpecification,
  RelationshipLineType,
} from './relation'
export { isThemeColor } from './theme'
export type {
  Color,
  ColorLiteral,
  ElementThemeColors,
  ElementThemeColorValues,
  HexColorLiteral,
  LikeC4Theme,
  RelationshipThemeColors,
  RelationshipThemeColorValues,
  ThemeColor,
  ThemeColorValues,
} from './theme'
export {
  ComputedNode, // namespace
  ComputedView, // namespace
  DiagramNode, // namespace
  extractStep,
  getBBoxCenter,
  getParallelStepsPrefix,
  isAutoLayoutDirection,
  isDeploymentView,
  isDynamicView,
  isDynamicViewParallelSteps,
  isElementView,
  isExtendsElementView,
  isScopedElementView,
  isStepEdgeId,
  isViewRuleAutoLayout,
  isViewRuleGlobalPredicateRef,
  isViewRuleGlobalStyle,
  isViewRuleGroup,
  isViewRulePredicate,
  isViewRuleStyle,
  stepEdgeId,
} from './view'
export type {
  AutoLayoutDirection,
  BasicElementView,
  BasicView,
  BBox,
  ComputedDeploymentView,
  ComputedDynamicView,
  ComputedEdge,
  ComputedElementView,
  CustomColorDefinitions,
  DeploymentView,
  DeploymentViewRule,
  DeploymentViewRulePredicate,
  DeploymentViewRuleStyle,
  DiagramEdge,
  DiagramView,
  DynamicView,
  DynamicViewIncludeRule,
  DynamicViewParallelSteps,
  DynamicViewRule,
  DynamicViewStep,
  DynamicViewStepOrParallel,
  EdgeId,
  ElementView,
  ExtendsElementView,
  LikeC4View,
  NodeId,
  ScopedElementView,
  StepEdgeId,
  StepEdgeIdLiteral,
  ViewAutoLayout,
  ViewId,
  ViewManualLayout,
  ViewRule,
  ViewRuleAutoLayout,
  ViewRuleGlobalPredicateRef,
  ViewRuleGlobalStyle,
  ViewRuleGroup,
  ViewRulePredicate,
  ViewRuleStyle,
  ViewRuleStyleOrGlobalRef,
  ViewWithHash,
  ViewWithNotation,
} from './view'
export type { ViewChange } from './view-changes'
export type { ElementNotation } from './view-notation'
