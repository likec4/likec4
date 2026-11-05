// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { type PropsWithChildren, createContext, useMemo, useRef } from 'react'
import type { CustomComponents, CustomizationContextValue } from './customizable'
import { type StableComponentInstances, applyStableCustomComponents } from './stableComponents'

export const CustomizationContext = createContext<CustomizationContextValue | null>(null)
CustomizationContext.displayName = 'CustomizationContext'

/**
 * Keeps a stable function identity per slot while swapping the underlying
 * implementation. That makes override maps HMR-friendly: dependents keep the
 * same component reference while the latest replace/wrap body is used.
 */
function useStableComponents(
  input: CustomizationContextValue['components'],
): CustomComponents | undefined {
  const instancesRef = useRef<StableComponentInstances>({})
  return useMemo(
    () => applyStableCustomComponents(instancesRef.current, input),
    [input],
  )
}

type CustomizationProviderProps = {
  /**
   * Slot overrides from {@link defineCustomComponents}.
   * Prefer a module-scoped constant so the map identity stays stable across HMR.
   */
  components?: CustomizationContextValue['components'] | undefined
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
  const value = useMemo(
    (): CustomizationContextValue => ({ components: stable }),
    [stable],
  )
  return (
    <CustomizationContext.Provider value={value}>
      {children}
    </CustomizationContext.Provider>
  )
}
