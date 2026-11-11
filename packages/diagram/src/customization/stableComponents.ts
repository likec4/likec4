// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { FC } from 'react'
import { isEmptyish } from 'remeda'
import { type CustomComponent, WrappedMarker } from './customization-types'

type AnyCustomComponent = CustomComponent<FC<any>>

type StableComponentEntry = {
  component: AnyCustomComponent
  instance: AnyCustomComponent
}

export type StableComponentInstances = Record<string, StableComponentEntry | undefined>

/**
 * Builds a components map with stable function identities per slot.
 * Mutates `instances` so later calls with new override bodies reuse the same shells.
 *
 * @internal
 */
export function applyStableCustomComponents<T extends { [K in keyof T]?: AnyCustomComponent | undefined }>(
  instances: StableComponentInstances,
  input: T | undefined,
): T | undefined {
  if (input === undefined) {
    return undefined
  }

  const next: Record<string, AnyCustomComponent> = {}

  for (const [key, value] of Object.entries<AnyCustomComponent | undefined>(input)) {
    if (value == null) {
      continue
    }
    let ref = instances[key]
    if (!ref) {
      const entry: StableComponentEntry = {
        component: value,
        instance: (props => entry.component(props)) as FC<any>,
      }
      ref = entry
      instances[key] = entry
    }
    ref.component = value
    if (value[WrappedMarker]) {
      ref.instance[WrappedMarker] = true
    } else {
      delete ref.instance[WrappedMarker]
    }
    next[key] = ref.instance
  }

  if (isEmptyish(next)) {
    return undefined
  }
  // Same keys as the input, values are stable instances of the same kind
  return next as T
}
