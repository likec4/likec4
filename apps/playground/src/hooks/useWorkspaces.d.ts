import type { LocalWorkspace } from '$state/types';
import type { SetOptional } from 'type-fest';
export declare const LikeC4WorkspacesKey = "likec4:workspaces";
export type LocalStorageWorkspace = {
    key: string;
    name: string;
    title: string;
};
export declare function useWorkspaces(): readonly [any, {
    readonly setWorkspaces: any;
    readonly removeWorkspace: (name: string) => void;
    readonly createNewFromBlank: () => void;
    readonly createNewFromCurrent: () => void;
    readonly createNew: (workspace: SetOptional<LocalWorkspace, "workspaceId">) => void;
}];
