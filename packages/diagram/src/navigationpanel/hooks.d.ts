import type { ViewId } from '@likec4/core';
import type { NavigationPanelActorContext, NavigationPanelActorEvent, NavigationPanelActorRef, NavigationPanelActorSnapshot } from './actor';
export declare const NavigationPanelActorContextProvider: import("react").Provider<NavigationPanelActorRef>;
export declare const useNavigationActorRef: () => NavigationPanelActorRef;
export declare function useNavigationActorSnapshot<T = unknown>(selector: (context: NavigationPanelActorSnapshot) => T, compare?: (a: NoInfer<T>, b: NoInfer<T>) => boolean): T;
export declare function useNavigationActorContext<T = unknown>(selector: (context: NavigationPanelActorContext) => T, compare?: (a: NoInfer<T>, b: NoInfer<T>) => boolean): T;
export interface NavigationActor {
    readonly actorRef: NavigationPanelActorRef;
    send: (event: NavigationPanelActorEvent) => void;
    selectFolder: (folderPath: string) => void;
    selectView: (viewId: ViewId) => void;
    /**
     * If the navigation dropdown is opened
     */
    isOpened: () => boolean;
    clearSearch: () => void;
    closeDropdown: () => void;
}
export declare function useNavigationActor(): NavigationActor;
