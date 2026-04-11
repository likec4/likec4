// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { anyPass, isDefined, isEmpty } from 'remeda'
import {
  type AnyAux,
  type AnyViewRuleStyle,
  type ComputedNode,
  type ElementViewRule,
  type Predicate,
  isGroupElementKind,
  isViewRuleStyle,
} from '../../types'
import { elementExprToPredicate } from './elementExpressionToPredicate'

export function applyViewRuleStyle<A extends AnyAux>(
  rule: Pick<AnyViewRuleStyle<A>, 'style' | 'notation'>,
  predicate: Predicate<ComputedNode<A>>,
  nodes: ComputedNode<A>[],
): void {
  const { shape, color, icon, ...rest } = rule.style
  const nonEmptyStyle = !isEmpty(rest)
  for (const node of nodes) {
    if (isGroupElementKind(node) || !predicate(node)) {
      continue
    }
    node.shape = shape ?? node.shape
    node.color = color ?? node.color
    if (isDefined(icon)) {
      node.icon = icon
    }
    if (isDefined(rule.notation)) {
      node.notation = rule.notation
    }
    if (nonEmptyStyle) {
      node.style = {
        ...node.style,
        ...rest,
      }
    }
  }
}

export function applyViewRuleStyles<A extends AnyAux, N extends ComputedNode<A>[]>(
  rules: ElementViewRule<A>[],
  nodes: N,
): N {
  for (const rule of rules) {
    if (!isViewRuleStyle(rule) || rule.targets.length === 0) {
      continue
    }
    const predicates = rule.targets.map(elementExprToPredicate)
    const predicate = predicates.length === 1 ? predicates[0]! : anyPass(predicates)
    applyViewRuleStyle(
      rule,
      predicate,
      nodes,
    )
  }
  return nodes
}
