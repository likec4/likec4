// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { isEmptyish, isNullish, omitBy } from 'remeda'
import {
  type CustomComponent,
  type CustomComponents,
  WrappedMarker,
} from './customizable'

export type StableComponentEntry = {
  component: CustomComponent<any>
  instance: CustomComponent<any>
}

export type StableComponentInstances = Record<string, StableComponentEntry | undefined>

/**
 * Builds a components map with stable function identities per slot.
 * Mutates `instances` so later calls with new override bodies reuse the same shells.
 *
 * @internal
 */
export function applyStableCustomComponents(
  instances: StableComponentInstances,
  input: CustomComponents | undefined,
): CustomComponents | undefined {
  const normalized = input === undefined ? undefined : omitBy(input, isNullish)
  if (normalized === undefined || isEmptyish(normalized)) {
    return undefined
  }

  const next: CustomComponents = {}

  for (const [key, value] of Object.entries(normalized)) {
    if (value == null) {
      continue
    }
    let ref = instances[key]
    if (!ref) {
      const entry: StableComponentEntry = {
        component: value,
        instance: (props => entry.component(props)) as CustomComponent<any>,
      }
      ref = entry
      instances[key] = entry
    }
    ref.component = value
    if (value[WrappedMarker]) {
      ref.instance[WrappedMarker] = true
    } else {
      delete ref.instance[WrappedMarker]
    } // Dynamic slot key — assign through a mutable record view.

    ;(next as Record<string, CustomComponent<any>>)[key] = ref.instance
  }

  return next
}
