// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { type ComponentProps, type ReactNode, use } from 'react'
import { CustomizationContext } from './CustomizationContext'

type FC<P = {}> = {
  (props: P): ReactNode
  displayName?: string | undefined
}

/**
 * Marker copied onto wrap overrides so the registered shell can inject `Original`.
 * @internal
 */
export const WrappedMarker = Symbol.for('likec4.customizable.wrapped')

export type Customizable<
  TComponent extends FC<any>,
  Name extends string,
> = TComponent & {
  readonly displayName: Name
}

/**
 * Augmentation interface for customizable component slots.
 *
 * Slots are registered by LikeC4 internals via {@link customizable}.
 * Consumers override them through {@link defineCustomComponents}.
 *
 * @experimental
 */
export interface RegisterCustomizable {
}

export type PropsOf<N extends keyof RegisterCustomizable> = ComponentProps<RegisterCustomizable[N]>

/**
 * The original implementation of a registered slot, passed to wrap overrides.
 *
 * @experimental
 */
export interface Original<N extends keyof RegisterCustomizable> {
  (props: PropsOf<N>): ReactNode
}

type Wrapper<N extends keyof RegisterCustomizable> = FC<
  {
    Original: Original<N>
  } & PropsOf<N>
>

/**
 * A replacement or wrap override for a registered slot.
 *
 * @experimental
 */
export interface CustomComponent<N extends keyof RegisterCustomizable> {
  (props: PropsOf<N>): ReactNode
  [WrappedMarker]?: true | undefined
}

/**
 * Partial map of slot overrides for {@link CustomizationProvider}.
 *
 * @experimental
 */
export type CustomComponents = {
  [K in keyof RegisterCustomizable]?: CustomComponent<K> | undefined
}

export type CustomizationContextValue = {
  components?: CustomComponents | undefined
}

type ValidRegistration<N extends string> = N extends keyof RegisterCustomizable ? N : never

type Registered = keyof RegisterCustomizable

/**
 * Marks a component as a wrap override. The registered shell injects `Original`
 * (the built-in implementation) into the props.
 *
 * @experimental
 */
export function wrapCustomComponent<N extends Registered>(
  wrapper: Wrapper<N>,
): CustomComponent<N> {
  return Object.assign(wrapper as CustomComponent<N>, { [WrappedMarker]: true as const })
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
 *   NavigationPanelLogo: wrap(({ Original, ...props }) => (
 *     <Original {...props} onClick={() => console.log('logo')} />
 *   )),
 * }))
 * ```
 *
 * @experimental
 */
export function defineCustomComponents<T extends CustomComponents>(
  value: T | ((ctx: { wrap: typeof wrapCustomComponent }) => T),
): T {
  if (typeof value === 'function') {
    return value({ wrap: wrapCustomComponent })
  }
  return value
}

function useCustomization<T extends Registered>(name: T): CustomComponent<T> | undefined {
  return use(CustomizationContext)?.components?.[name] as CustomComponent<T> | undefined
}

const registry = new Map<Registered, {
  Original: FC<any>
  Registered: FC<any>
}>()

function register<
  Name extends string,
  TComponent extends FC<any>,
>(
  displayName: Name,
  original: TComponent,
): Customizable<TComponent, Name> {
  const name = displayName as Registered
  const existing = registry.get(name)
  if (existing) {
    // HMR: keep the same Registered shell, swap the Original implementation.
    existing.Original = original
    return existing.Registered as Customizable<TComponent, Name>
  }

  type OriginalProps = ComponentProps<typeof original>
  type OriginalFC = FC<OriginalProps>

  const ref = {
    Original: original as OriginalFC,
    Registered: ((props: OriginalProps) => {
      const Cmp = useCustomization(name)
      if (Cmp) {
        if (Cmp[WrappedMarker]) {
          return <>{Cmp({ Original: ref.Original, ...props })}</>
        }
        return <>{Cmp(props)}</>
      }
      return <ref.Original {...props} />
    }) as OriginalFC,
  }
  ref.Registered.displayName = displayName

  registry.set(name, ref)
  return ref.Registered as Customizable<TComponent, Name>
}

/**
 * Registers a LikeC4 UI slot that consumers can override via {@link CustomizationProvider}.
 *
 * @internal Prefer not to call from user code — slot names are owned by LikeC4.
 */
export function customizable<Name extends string>(
  displayName: Name & ValidRegistration<Name>,
): <TComponent extends FC<any>>(
  Component: TComponent,
) => Customizable<TComponent, Name> {
  return (Component) => register(displayName, Component)
}
