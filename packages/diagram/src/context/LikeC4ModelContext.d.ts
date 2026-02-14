import type { LikeC4Model, LikeC4ViewModel } from '@likec4/core/model';
import type * as t from '@likec4/core/types';
import type { LayoutedView } from '@likec4/core/types';
import { type PropsWithChildren } from 'react';
type UnknownLayouted = t.aux.UnknownLayouted;
export declare const LikeC4ModelContextProvider: import("react").Provider<any>;
export type CurrentViewModel = LikeC4ViewModel<UnknownLayouted, LayoutedView<UnknownLayouted>>;
export declare const CurrentViewModelContext: import("react").Provider<any>;
export declare function EnsureCurrentViewModel({ children }: PropsWithChildren): import("react").JSX.Element;
/**
 * @returns The LikeC4Model from context, or null if no LikeC4ModelProvider is found.
 */
export declare function useOptionalLikeC4Model<A extends t.aux.Any = UnknownLayouted>(): LikeC4Model<A> | null;
export declare function useOptionalCurrentViewModel(): CurrentViewModel | null;
export {};
