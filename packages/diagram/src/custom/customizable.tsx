// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

// import type { Customizable, Customizables, FC, ValidName } from '@likec4/diagram-customization'
// import type { CustomComponentName } from '@likec4/diagram-customization'
import { type ComponentProps, type FC, type JSX, type ReactNode, use } from 'react'
import type { Simplify } from 'type-fest'
import {
  type CustomComponent,
  type CustomComponents,
  type Customizable,
  type CustomizableName,
  type Customizables,
  type Wrapper,
  WrappedMarker,
} from './customization-types'
import { CustomizationContext } from './CustomizationContext'

// type FC<P = {}> = {
//   (props: P): ReactNode
//   displayName?: string | undefined
// }

// /**
//  * Marker copied onto wrap overrides so the registered shell can inject `Original`.
//  * @internal
//  */
// export const WrappedMarker = Symbol.for('likec4.customizable.wrapped')

// export type { Customizable } from '@likec4/diagram-customization'
// // export type Customizable<
// //   TComponent extends FC<any>,
// //   Name extends string,
// // > = TComponent & {
// //   readonly displayName: Name
// // }

// /**
//  * Augmentation interface for customizable component slots.
//  *
//  * Slots are registered by LikeC4 internals via {@link customizable}.
//  * Consumers override them through {@link defineCustomComponents}.
//  *
//  * @experimental
//  */
// export interface RegisterCustomizable {
// }

// export type PropsOf<N> = N extends (props: infer P) => any ? P : never

// /**
//  * The original implementation of a registered slot, passed to wrap overrides.
//  *
//  * @experimental
//  */
// export interface Original<N extends keyof RegisterCustomizable> {
//   (props: PropsOf<N>): ReactNode
// }

// type Wrapper<P> = (props: P & { Original: FC<P> }) => JSX.Element

// /**
//  * A replacement or wrap override for a registered slot.
//  */
// export type CustomComponent<N extends CustomComponentName> =
//   | Customizables[N] & {
//     [WrappedMarker]?: never
//   }
//   | Wrapper<PropsOf<Customizables[N]>> & {
//     [WrappedMarker]: true
//   }

// /**
//  * Partial map of slot overrides for {@link CustomizationProvider}.
//  *
//  * @experimental
//  */
// export type CustomComponents = {
//   [K in Registered]?: CustomComponent<K>
// }

// export type CustomizationContextValue = {
//   components?: CustomComponents | undefined
// }

// type Registered = CustomComponentName

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
 *
 * Prefer keeping the returned object referentially stable (module scope) so
 * HMR and re-renders keep override identities stable via {@link CustomizationProvider}.
 *
 * @example
 * ```tsx
 * const components = defineCustomComponents(({ wrap }) => ({
 *   LogoSvg: () => <span>My logo</span>, // replace
 *   LogoIconSvg: wrap(({ Original, ...props }) => (
 *     <Original {...props} onClick={() => console.log('logo')} />
 *   )),
 * }))
 * ```
 *
 * @experimental
 */
export function defineCustomComponents(
  value: Partial<Customizables> | ((ctx: { wrap: typeof wrapOriginal }) => Partial<Customizables>),
): CustomComponents {
  if (typeof value === 'function') {
    return value({ wrap: wrapOriginal })
  }
  return value
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
        return <Cmp Original={ref.Original} {...props} />
      }
      return <Cmp {...props} />
    }) as OriginalFC,
  }
  ref.HMRBoundary.displayName = displayName

  registry.set(name, ref)
  return ref.HMRBoundary as Customizable<TComponent, Name>
}

/**
 * Registers a LikeC4 UI slot that consumers can override via {@link CustomizationProvider}.
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
