import { hcWithType } from '#worker/client';
import { notFound } from '@tanstack/react-router';
const workerApi = hcWithType('');
// type WorkerApi = typeof workerApi
export function json(req) {
    return async (..._args) => {
        const response = await req(..._args);
        if (response.status === 404) {
            throw notFound();
        }
        if (!response.ok) {
            throw new Error(`Request ${response.url} failed with status ${response.status}`);
        }
        return await response.json();
    };
}
export const api = {
    auth: {
        me: json(workerApi.auth.me.$get),
    },
    share: {
        my: json(workerApi.api.share.my.$get),
        create: json(workerApi.api.share.$post),
        checkPin: async (shareId, pincode) => {
            const response = await workerApi.api.share[':shareId']['check-pincode'].$post({
                param: { shareId },
                json: { pincode },
            });
            if (!response.ok) {
                const error = await response.text();
                return {
                    valid: false,
                    error: error || response.statusText,
                };
            }
            return await response.json();
        },
        // Force type cast to make TypeScript happy
        get: async (shareId) => {
            const response = await workerApi.api.share[':shareId'].$get({ param: { shareId } });
            if (response.status === 404) {
                throw notFound();
            }
            if (!response.ok) {
                throw new Error(`Request ${response.url} failed with status ${response.status}`);
            }
            return await response.json();
        },
    },
};
