import type { LikeC4Services, LikeC4SharedServices } from '../module';
export type * from '../common-exports';
export { createLanguageServices, NoFileSystem, NoFileSystemWatcher, NoLikeC4ManualLayouts, NoMCPServer, } from '../common-exports';
export declare function startLanguageServer(port: MessagePort | DedicatedWorkerGlobalScope): {
    shared: LikeC4SharedServices;
    likec4: LikeC4Services;
};
