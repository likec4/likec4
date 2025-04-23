export type {
  CustomColor,
  ExclusiveUnion,
  IteratorLike,
  KeysOf,
  NonEmptyArray,
  NonEmptyReadonlyArray,
  NTuple,
  Point,
  Predicate,
  XYPoint,
} from './_common'

export {
  AsFqn,
  GlobalFqn,
  isGlobalFqn,
  splitGlobalFqn,
} from './scalars'

export type {
  Fqn,
  IconUrl,
  ProjectId,
  Tag,
} from './scalars'

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
  BorderStyles,
  DefaultElementShape,
  DefaultPaddingSize,
  DefaultShapeSize,
  DefaultTextSize,
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
  Link,
  TagSpec,
  TypedElement,
} from './element'

export { ExpressionV2, FqnExpr, FqnRef, RelationExpr } from './expression-v2'
export { ModelLayer } from './expression-v2-model'

export type {
  GlobalDynamicPredicates,
  GlobalPredicateId,
  GlobalPredicates,
  GlobalStyleID,
  GlobalStyles,
  ModelGlobals,
} from './global'

export type {
  AnyParsedLikeC4ModelData,
  ComputedLikeC4ModelData,
  GenericLikeC4ModelData,
  LayoutedLikeC4ModelData,
  LikeC4ModelDump,
  ParsedLikeC4ModelData,
} from './model-data'

export {
  isAndOperator,
  isKindEqual,
  isNotOperator,
  isOrOperator,
  isParticipantOperator,
  isTagEqual,
  whereOperatorAsPredicate,
} from './operators'
export type {
  AllNever,
  AndOperator,
  EqualOperator,
  Filterable,
  KindEqual,
  NotOperator,
  OperatorPredicate,
  OrOperator,
  Participant,
  ParticipantOperator,
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
export { isThemeColor, ThemeColors } from './theme'
export type {
  Color,
  ColorLiteral,
  ElementThemeColors,
  ElementThemeColorValues,
  HexColorLiteral,
  LikeC4Theme,
  RelationshipThemeColors,
  RelationshipThemeColorValues,
  ShapeSize,
  SpacingSize,
  TextSize,
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
