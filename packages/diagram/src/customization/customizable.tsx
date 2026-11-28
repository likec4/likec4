// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { type ComponentProps, type FC, createContext, use } from 'react'
import {
  type CustomComponent,
  type CustomComponents,
  type Customizable,
  type CustomizableName,
  WrappedMarker,
} from './customization-types'

export const CustomizationContext = createContext<CustomizationProps | null>(null)
CustomizationContext.displayName = 'CustomizationContext'

/**
 * Value of {@link CustomizationContext}
 */
export interface CustomizationProps {
  /**
   * Slot overrides from `customizeComponents`.
   * Prefer a module-scoped constant so the map identity stays stable across HMR.
   */
  components?: CustomComponents | undefined
}

function useCustomization(name: CustomizableName): CustomComponent<FC<any>> | undefined {
  return use(CustomizationContext)?.components?.[name]
}

const registry = new Map<CustomizableName, {
  Original: FC<any>
  HMRBoundary: FC<any>
}>()

function register<
  Name extends string,
  TComponent extends FC<any>,
>(
  displayName: Name,
  original: TComponent,
): Customizable<TComponent, Name> {
  const name = displayName as CustomizableName
  const existing = registry.get(name)
  if (existing) {
    // HMR: keep the same Registered shell, swap the Original implementation.
    existing.Original = original
    return existing.HMRBoundary as Customizable<TComponent, Name>
  }

  type OriginalProps = ComponentProps<typeof original>
  type OriginalFC = FC<OriginalProps>

  const ref = {
    Original: original as OriginalFC,
    HMRBoundary: ((props: OriginalProps) => {
      const Cmp = useCustomization(name)
      if (!Cmp) {
        return <ref.Original {...props} />
      }
      if (Cmp[WrappedMarker]) {
        return <>{Cmp({ Original: ref.Original, ...props })}</>
      }
      return <>{Cmp(props)}</>
    }) as OriginalFC,
  }
  ref.HMRBoundary.displayName = displayName

  registry.set(name, ref)
  return ref.HMRBoundary as Customizable<TComponent, Name>
}

/**
 * Registers a LikeC4 UI slot that consumers can override via `createCustomization`.
 *
 * @internal Prefer not to call from user code — slot names are owned by LikeC4.
 */
export function customizable<Name extends string>(
  displayName: Name,
): <TComponent extends FC<any>>(
  Component: TComponent,
) => Customizable<TComponent, Name> {
  return (Component) => register(displayName, Component)
}
