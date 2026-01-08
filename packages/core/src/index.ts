export { LikeC4Styles } from './styles'
export type {
  LikeC4StyleDefaults,
  LikeC4StylesConfig,
  LikeC4Theme,
  ThemeColorValues,
} from './styles'

export * from './types'

export {
  ancestorsFqn,
  BiMap,
  DefaultMap,
  DefaultWeakMap,
  hasProp,
  invariant,
  isAncestor,
  isDescendantOf,
  isIterable,
  isNonEmptyArray,
  isSameHierarchy,
  isString,
  LinkedList,
  memoizeProp,
  MultiMap,
  nameFromFqn,
  nonexhaustive,
  nonNullable,
  parentFqn,
  Queue,
  sortNaturalByFqn,
  sortParentsFirst,
} from './utils'

export {
  applyManualLayout,
  calcDriftsFromSnapshot,
} from './manual-layout'

export type {
  ComputedProjectsView,
  LayoutedProjectsView,
} from './compute-view/projects-view/_types'
