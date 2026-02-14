import type { LayoutedView, ViewId } from '@likec4/core/types';
import { type ActorRef, type SnapshotFrom, type StateMachine } from 'xstate';
import type { CurrentViewModel } from '../hooks/useCurrentViewModel';
export interface NavigationPanelActorInput {
    view: LayoutedView;
    viewModel: CurrentViewModel | null;
}
export type NavigationPanelActorEvent = {
    type: 'update.inputs';
    inputs: NavigationPanelActorInput;
} | {
    type: 'searchQuery.change';
    value: string;
} | {
    type: 'searchQuery.changed';
} | {
    type: 'select.folder';
    folderPath: string;
} | {
    type: 'select.view';
    viewId: ViewId;
} | {
    type: 'breadcrumbs.mouseLeave';
} | {
    type: 'breadcrumbs.mouseEnter.root';
} | {
    type: 'breadcrumbs.mouseLeave.root';
} | {
    type: 'breadcrumbs.mouseEnter.folder';
    folderPath: string;
} | {
    type: 'breadcrumbs.mouseLeave.folder';
    folderPath: string;
} | {
    type: 'breadcrumbs.mouseEnter.viewtitle';
} | {
    type: 'breadcrumbs.mouseLeave.viewtitle';
} | {
    type: 'breadcrumbs.click.root';
} | {
    type: 'breadcrumbs.click.folder';
    folderPath: string;
} | {
    type: 'breadcrumbs.click.viewtitle';
} | {
    type: 'dropdown.mouseEnter';
} | {
    type: 'dropdown.mouseLeave';
} | {
    type: 'dropdown.dismiss';
};
export type NavigationPanelActorEmitted = {
    type: 'navigateTo';
    viewId: ViewId;
};
export type BreadcrumbItem = {
    type: 'folder';
    folderPath: string;
    title: string;
} | {
    type: 'viewtitle';
    title: string;
};
export type DropdownColumnItem = {
    type: 'folder';
    folderPath: string;
    title: string;
    selected: boolean;
} | {
    type: 'view';
    viewType: 'element' | 'deployment' | 'dynamic' | 'index';
    viewId: string;
    title: string;
    description: string | null;
    selected: boolean;
};
export interface NavigationPanelActorContext {
    view: LayoutedView;
    viewModel: CurrentViewModel | null;
    /**
     * Who activated the dropdown
     * (if `click` then the dropdown is always open until dismissed)
     * @default 'hover'
     */
    activatedBy: 'hover' | 'click';
    /**
     * The folder that is currently selected in the dropdown
     * By default it is the root
     */
    selectedFolder: string;
    searchQuery: string;
}
type Tags = 'active';
export interface NavigationPanelActorLogic extends StateMachine<NavigationPanelActorContext, NavigationPanelActorEvent, {}, any, any, any, any, any, Tags, NavigationPanelActorInput, any, NavigationPanelActorEmitted, any, any> {
}
export declare const navigationPanelActorLogic: NavigationPanelActorLogic;
export type NavigationPanelActorSnapshot = SnapshotFrom<NavigationPanelActorLogic>;
export interface NavigationPanelActorRef extends ActorRef<NavigationPanelActorSnapshot, NavigationPanelActorEvent, NavigationPanelActorEmitted> {
}
export {};
