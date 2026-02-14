import type { ViewLocateResult } from '../model/model-locator';
import type { LikeC4Services } from '../module';
type RemoveManualLayoutV1Args = {
    lookup: ViewLocateResult;
};
export declare function removeManualLayoutV1(services: LikeC4Services, { lookup, }: RemoveManualLayoutV1Args): Promise<boolean>;
export {};
