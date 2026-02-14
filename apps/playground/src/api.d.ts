import { type Client as WorkerApi } from '#worker/client';
import type { SharedPlayground } from '#worker/types';
import type { ClientResponse, InferRequestType, InferResponseType } from 'hono/client';
import type { Get } from 'type-fest';
export declare function json<T, A extends any[]>(req: (...a: A) => Promise<ClientResponse<T, any, 'json'>>): (...a: A) => Promise<T>;
export declare namespace Api {
    namespace Share {
        type Payload = InferRequestType<Get<WorkerApi, 'api.share.$post'>>['json'];
        type Response = InferResponseType<Get<WorkerApi, 'api.share.$post'>>;
    }
}
export declare const api: {
    auth: {
        me: (...a: any[]) => Promise<unknown>;
    };
    share: {
        my: (...a: any[]) => Promise<unknown>;
        create: (...a: any[]) => Promise<unknown>;
        checkPin: (shareId: string, pincode: string) => Promise<any>;
        get: (shareId: string) => Promise<SharedPlayground>;
    };
};
