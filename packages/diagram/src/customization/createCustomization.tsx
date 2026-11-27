// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { JSX, PropsWithChildren } from 'react'
import type { CustomComponents, Customizables, Wrapper } from './customization-types'
import { type CustomizationProps, CustomizationContext } from './customizable'
import { WrappedMarker } from './customization-types'

/**
 * Provider returned by {@link createCustomization}
 */
export type CustomizationProvider = (props: PropsWithChildren) => JSX.Element

/**
 * Marks a component as a wrap override. The registered shell injects `Original`
 * (the built-in implementation) into the props.
 *
 * @experimental
 */
function wrapOriginal<P>(
  wrapper: Wrapper<P>,
): (props: P) => any {
  return Object.assign(wrapper, { [WrappedMarker]: true as const }) as any
}

/**
 * Defines overrides for registered customizable slots.
 * To be used with {@link createCustomization}.
 *
 * Overrides support two modes:
 * - **replace** — pass a component that receives the original props
 * - **wrap** — use `wrap` function; receives `{ Original, ...props }`
 *
 * @example
 * ```tsx
 * import { customizeComponents } from 'likec4/react'
 *
 * const components = customizeComponents(({ wrap }) => ({
 *   Logo: () => <span>My logo</span>, // replace
 *   LikeC4Diagram: wrap(({ Original, ...props }) => (
 *     <Original {...props} pannable={false} />
 *   )),
 * }))
 * ```
 *
 * @experimental
 */
export function customizeComponents(
  value: Partial<Customizables> | ((ctx: { wrap: typeof wrapOriginal }) => Partial<Customizables>),
): CustomComponents {
  return typeof value === 'function' ? value({ wrap: wrapOriginal }) : value
}

/**
 * Creates a customization context provider that can be used to override or
 * extend the default UI components used by LikeC4.
 *
 * Place this above the diagram tree (`LikeC4Diagram` / `ReactLikeC4` / `LikeC4View`).
 * Ordering relative to `LikeC4ModelProvider` does not matter.
 *
 * @example
 * ```tsx
 * import { createCustomization, customizeComponents, LikeC4ModelProvider } from 'likec4/react'
 *
 * const Customization = createCustomization({
 *   components: customizeComponents(({ wrap }) => ({
 *     Logo: () => <span>Brand</span>,
 *     LikeC4Diagram: wrap(({ Original, ...props }) => (
 *       <Original {...props} pannable={false} />
 *     )),
 *   })),
 * })
 *
 * function App() {
 *   return (
 *     <Customization>
 *       <LikeC4ModelProvider likec4model={model}>
 *         <LikeC4View viewId="index" />
 *       </LikeC4ModelProvider>
 *     </Customization>
 *   )
 * }
 * ```
 * @experimental
 */
export function createCustomization(value: CustomizationProps): CustomizationProvider {
  const customizationValue: CustomizationProps = {
    components: value.components,
  }
  // Keep the provider anonymous (no name, no displayName): React Refresh would treat
  // a named default export of the customization file as a component and make the file
  // an HMR boundary, so `likec4:customization` would not pick up the new overrides.
  return ({ children }) => (
    <CustomizationContext.Provider value={customizationValue}>
      {children}
    </CustomizationContext.Provider>
  )
}
