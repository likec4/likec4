import DefaultMap from 'mnemonist/default-map'
import LinkedList from 'mnemonist/linked-list'

export { DefaultMap, LinkedList }

export {
  commonHead,
} from './common-head'

export {
  compareNatural,
} from './compare-natural'
export {
  ancestorsFqn,
  commonAncestor,
  compareByFqnHierarchically,
  compareFqnHierarchically,
  hierarchyDistance,
  hierarchyLevel,
  isAncestor,
  isDescendantOf,
  isSameHierarchy,
  type IterableContainer,
  nameFromFqn,
  parentFqn,
  type ReorderedArray,
  sortByFqnHierarchically,
  sortNaturalByFqn,
  sortParentsFirst,
} from './fqn'

export * from './getOrCreate'
export {
  hasAtLeast,
  isNonEmptyArray,
  isString,
} from './guards'
export {
  ifilter,
  iflat,
  imap,
  isIterable,
  isome,
  iunique,
  toArray,
  toSet,
} from './iterable'
export {
  delay,
} from './promises'

export {
  compareRelations,
} from './relations'

export {
  difference,
  equals as equalsSet,
  intersection,
  symmetricDifference,
  union,
} from './set'

export {
  stringHash,
} from './string-hash'

export {
  objectHash,
} from './object-hash'
