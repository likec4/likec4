// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.
import { isEmptyish, isNullish, omitBy } from 'remeda'

import { type FC, type PropsWithChildren, createContext, useMemo, useRef } from 'react'
import { type CustomComponent, type CustomComponents, WrappedMarker } from './customization-types'

type CustomizationContextValue = {
  components: CustomComponents
}

export const CustomizationContext = createContext<CustomizationContextValue | null>(null)
CustomizationContext.displayName = 'CustomizationContext'

type CustomizationProviderProps = {
  /**
   * Slot overrides from {@link defineCustomComponents}.
   * Prefer a module-scoped constant so the map identity stays stable across HMR.
   */
  components?: CustomComponents | undefined
}

/**
 * Provides UI slot overrides for registered customizable components
 * (`LikeC4Diagram`, logos, …).
 *
 * Place this above the diagram tree (`LikeC4Diagram` / `ReactLikeC4` / `LikeC4View`).
 * Ordering relative to `LikeC4ModelProvider` does not matter.
 *
 * Overrides support two modes:
 * - **replace** — pass a component that receives the original props
 * - **wrap** — use `wrap` from {@link defineCustomComponents}; receives `{ Original, ...props }`
 *
 * @experimental
 *
 * @example
 * ```tsx
 * import {
 *   CustomizationProvider,
 *   defineCustomComponents,
 * } from 'likec4/react'
 *
 * const components = defineCustomComponents(({ wrap }) => ({
 *   LogoSvg: () => <span>Brand</span>,
 *   LikeC4Diagram: wrap(({ Original, ...props }) => (
 *     <Original {...props} pannable={false} />
 *   )),
 * }))
 *
 * function App() {
 *   return (
 *     <CustomizationProvider components={components}>
 *       <LikeC4ModelProvider model={model}>
 *         <LikeC4View viewId="index" />
 *       </LikeC4ModelProvider>
 *     </CustomizationProvider>
 *   )
 * }
 * ```
 */
export function CustomizationProvider({
  components,
  children,
}: PropsWithChildren<CustomizationProviderProps>) {
  const stable = useStableComponents(components)
  return (
    <CustomizationContext.Provider
      value={useMemo(
        () => stable ? { components: stable } : null,
        [stable],
      )}>
      {children}
    </CustomizationContext.Provider>
  )
}

/**
 * Keeps a stable function identity per slot while swapping the underlying
 * implementation. That makes override maps HMR-friendly: dependents keep the
 * same component reference while the latest replace/wrap body is used.
 */
function useStableComponents(
  input: CustomComponents | undefined,
): CustomComponents | undefined {
  const instancesRef = useRef<StableComponentInstances>({})
  return useMemo(
    () => applyStableCustomComponents(instancesRef.current, input),
    [input],
  )
}

type StableComponentEntry = {
  component: CustomComponent<FC<any>>
  instance: CustomComponent<FC<any>>
}

type StableComponentInstances = Record<string, StableComponentEntry | undefined>

/**
 * Builds a components map with stable function identities per slot.
 * Mutates `instances` so later calls with new override bodies reuse the same shells.
 *
 * @internal
 */
function applyStableCustomComponents(
  instances: StableComponentInstances,
  input: CustomComponents | undefined,
): CustomComponents | undefined {
  const normalized = input === undefined
    ? undefined
    : omitBy(input, isNullish) as Record<string, CustomComponent<FC<any>>>
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
    } // Dynamic slot key — assign through a mutable record view.

    ;(next as Record<string, CustomComponent<any>>)[key] = ref.instance
  }

  return next
}
