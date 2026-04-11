// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

export {
  DefaultMap,
  DefaultWeakMap,
  LinkedList,
  MultiMap,
  Queue,
  Stack,
} from './mnemonist'

export { invariant, nonexhaustive, nonNullable } from './invariant'

export {
  compareNatural,
  compareNaturalHierarchically,
  sortNatural,
} from './compare-natural'

export {
  ancestorsFqn,
  commonAncestor,
  compareByFqnHierarchically,
  compareFqnHierarchically,
  forEachAncestorFqn,
  hierarchyDistance,
  hierarchyLevel,
  isAncestor,
  isDescendantOf,
  isSameHierarchy,
  nameFromFqn,
  parentFqn,
  sortByFqnHierarchically,
  sortNaturalByFqn,
  sortParentsFirst,
} from './fqn'

export { getOrCreate } from './getOrCreate'

// Re-export for backwards compatibility
export {
  isNonEmptyArray,
  isString,
} from '../types/guards'

export {
  ifilter,
  ifind,
  ifirst,
  iflat,
  iflatMap,
  ihead,
  imap,
  ireduce,
  isIterable,
  isome,
  iunique,
  toArray,
  toSet,
} from './iterable'
export { memoizeProp } from './memoize-prop'
export { delay, onNextTick, promiseNextTick } from './promises'

export { compareRelations } from './relations'

export {
  difference,
  equals as equalsSet,
  intersection,
  symmetricDifference,
  union,
} from './set'

export { objectHash } from './object-hash'
export { stringHash } from './string-hash'

export { markdownToHtml, markdownToText } from './markdown'
