declare module 'likec4:projects' {
  export const isSingleProject: boolean
  export const projects: readonly [string, ...string[]]
}

declare module 'likec4:icons' {
  import type { ReactNode } from 'react'

  export type ElementIconRendererProps = {
    node: {
      id: string
      title: string
      icon?: string | null | undefined
    }
  }

  export type ElementIconRenderer = (props: ElementIconRendererProps) => ReactNode
  export const ProjectIcons: (projectId: string) => ElementIconRenderer
}

declare module 'likec4:model' {
  import type { DiagramView, LayoutedLikeC4ModelData, LikeC4Model, UnknownLayouted } from 'likec4/model'

  /**
   * Temporary copy-paste of the `Atom` interface from `nanostores` to avoid
   * type errors in the Vite plugin.
   */
  export interface Atom<T> {
    /**
     * Get store value.
     *
     * In contrast with {@link Atom#value} this value will be always
     * initialized even if store had no listeners.
     *
     * ```js
     * $store.get()
     * ```
     *
     * @returns Store value.
     */
    get(): T

    /**
     * Listeners count.
     */
    readonly lc: number

    /**
     * Subscribe to store changes.
     *
     * In contrast with {@link Store#subscribe} it do not call listener
     * immediately.
     *
     * @param listener Callback with store value and old value.
     * @returns Function to remove listener.
     */
    listen(
      listener: (
        value: T,
        oldValue: T,
      ) => void,
    ): () => void

    /**
     * Low-level method to notify listeners about changes in the store.
     *
     * Can cause unexpected behaviour when combined with frontend frameworks
     * that perform equality checks for values, such as React.
     */
    notify(oldValue?: ReadonlyIfObject<Value>): void

    /**
     * Unbind all listeners.
     */
    off(): void

    /**
     * Subscribe to store changes and call listener immediately.
     *
     * ```
     * import { $router } from '../store'
     *
     * $router.subscribe(page => {
     *   console.log(page)
     * })
     * ```
     *
     * @param listener Callback with store value and old value.
     * @returns Function to remove listener.
     */
    subscribe(
      listener: (
        value: T,
        oldValue?: T,
      ) => void,
    ): () => void

    /**
     * Low-level method to read store’s value without calling `onStart`.
     *
     * Try to use only {@link Atom#get}.
     * Without subscribers, value can be undefined.
     */
    readonly value: undefined | T
  }

  export type { DiagramView, LayoutedLikeC4ModelData, LikeC4Model, UnknownLayouted }

  export function loadModel(projectId: string): Promise<{
    $likec4data: Atom<LayoutedLikeC4ModelData<UnknownLayouted>>
    $likec4model: Atom<LikeC4Model<UnknownLayouted>>
    useLikeC4Model: () => LikeC4Model<UnknownLayouted>
    useLikeC4Views: () => ReadonlyArray<DiagramView<UnknownLayouted>>
    useLikeC4View: (viewId: string) => DiagramView<UnknownLayouted> | null
  }>
}

declare module 'likec4:single-project' {
  import type { DiagramView, LayoutedLikeC4ModelData, LikeC4Model, UnknownLayouted } from 'likec4/model'
  import type { ElementIconRenderer } from 'likec4:icons'
  import type { Atom } from 'likec4:model'

  export const $likec4data: Atom<LayoutedLikeC4ModelData<UnknownLayouted>>
  export const $likec4model: Atom<LikeC4Model<UnknownLayouted>>
  export function useLikeC4Model(): LikeC4Model<UnknownLayouted>
  export function useLikeC4Views(): ReadonlyArray<DiagramView<UnknownLayouted>>
  export function useLikeC4View(viewId: string): DiagramView<UnknownLayouted> | null

  export const IconRenderer: ElementIconRenderer

  export const projectId: string
}

declare module 'likec4:react' {
  import type { aux, DiagramView, LikeC4Model, UnknownLayouted } from 'likec4/model'
  import type { LikeC4ViewProps, ReactLikeC4Props } from 'likec4/react'
  import type { JSX, PropsWithChildren } from 'react'

  // This will be used later for augmenting the types
  interface Types extends UnknownLayouted {
  }

  export type LikeC4ViewId = aux.ViewId<Types>

  export function useLikeC4Model(): LikeC4Model<Types>
  export function useLikeC4Views(): ReadonlyArray<DiagramView<Types>>
  export function useLikeC4View(viewId: LikeC4ViewId): DiagramView<Types> | null

  export function LikeC4ModelProvider(props: PropsWithChildren): JSX.Element
  export function LikeC4View({ viewId, ...props }: LikeC4ViewProps<Types>): JSX.Element
  export function ReactLikeC4({ viewId, ...props }: ReactLikeC4Props<Types>): JSX.Element
}

declare module 'likec4:dot' {
  export function loadDotSources(projectId: string): Promise<{
    dotSource(viewId: string): string
    svgSource(viewId: string): string
  }>
}
declare module 'likec4:d2' {
  export function loadD2Sources(projectId: string): Promise<{
    d2Source(viewId: string): string
  }>
}
declare module 'likec4:mmd' {
  export function loadMmdSources(projectId: string): Promise<{
    mmdSource(viewId: string): string
  }>
}
declare module 'likec4:puml' {
  export function loadPumlSources(projectId: string): Promise<{
    pumlSource(viewId: string): string
  }>
}

// Per project

declare module 'likec4:model/*' {
  import type { aux, DiagramView, LayoutedLikeC4ModelData, LikeC4Model, UnknownLayouted } from 'likec4/model'
  import type { Atom } from 'likec4:model'

  // This will be used later for augmenting the types
  interface Types extends UnknownLayouted {
  }

  export type LikeC4ViewId = aux.ViewId<Types>

  export const $likec4data: Atom<LayoutedLikeC4ModelData<Types>>
  export const $likec4model: Atom<LikeC4Model<Types>>
  export function useLikeC4Model(): LikeC4Model<Types>
  export function useLikeC4Views(): ReadonlyArray<DiagramView<Types>>
  export function useLikeC4View(viewId: LikeC4ViewId): DiagramView<Types> | null
}

declare module 'likec4:icons/*' {
  import type { ReactNode } from 'react'
  type ElementIconRendererProps = {
    node: {
      id: string
      title: string
      icon?: string | null | undefined
    }
  }
  export function IconRenderer(props: ElementIconRendererProps): ReactNode
}

declare module 'likec4:react/*' {
  import type { aux, DiagramView, LikeC4Model, UnknownLayouted } from 'likec4/model'
  import type { LikeC4ViewProps, ReactLikeC4Props } from 'likec4/react'
  import type { JSX, PropsWithChildren } from 'react'

  // This will be used later for augmenting the types
  interface Types extends UnknownLayouted {
  }

  export type LikeC4ViewId = aux.ViewId<Types>

  export function useLikeC4Model(): LikeC4Model<Types>
  export function useLikeC4Views(): ReadonlyArray<DiagramView<Types>>
  export function useLikeC4View(viewId: LikeC4ViewId): DiagramView<Types> | null

  export function LikeC4ModelProvider(props: PropsWithChildren): JSX.Element
  export function LikeC4View({ viewId, ...props }: LikeC4ViewProps<Types>): JSX.Element
  export function ReactLikeC4({ viewId, ...props }: ReactLikeC4Props<Types>): JSX.Element
}
