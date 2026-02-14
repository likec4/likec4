import { sort } from 'remeda';
import { describe, expect, it } from 'vitest';
import { compareRelations } from './relations';
describe('compareRelations', () => {
    function rel(source, target) {
        return {
            source: {
                id: source,
            },
            target: {
                id: target,
            },
        };
    }
    function sorted(...relations) {
        return sort(relations, compareRelations).map(r => r.source.id + ' -> ' + r.target.id);
    }
    it('should sort by source and target', () => {
        expect(sorted(rel('customer', 'cloud.ui'), rel('customer', 'cloud'))).toEqual([
            'customer -> cloud',
            'customer -> cloud.ui',
        ]);
        expect(sorted(rel('1', '2.1'), rel('1', '2'), rel('1.1.1', '2'), rel('1.1.1', '2.1'), rel('1.1', '2'))).toEqual(['1 -> 2', '1 -> 2.1', '1.1 -> 2', '1.1.1 -> 2', '1.1.1 -> 2.1']);
    });
    it('should sort by parent', () => {
        expect(sorted(
        // same parent
        rel('cloud.1.1', 'cloud.2.1'), rel('cloud.1.1', 'cloud.2'), rel('cloud.1', 'cloud.2.1'), rel('cloud.1', 'cloud.2'), 
        // no same parent
        rel('cloud.1.1', 'aws.1'), rel('cloud.1', 'aws.1'), rel('cloud', 'aws'))).toEqual([
            'cloud -> aws',
            'cloud.1 -> aws.1',
            'cloud.1.1 -> aws.1',
            'cloud.1 -> cloud.2',
            'cloud.1 -> cloud.2.1',
            'cloud.1.1 -> cloud.2',
            'cloud.1.1 -> cloud.2.1',
        ]);
    });
    it('should sort by ancestors', () => {
        expect(sorted(
        // same parent 2nd level
        rel('cloud.api.1', 'cloud.api.2'), rel('cloud.ui.1', 'cloud.ui.2'), rel('cloud.ui.2', 'cloud.ui.1'), 
        // same ancestor cloud
        rel('cloud.ui.1', 'cloud.api.1'), rel('cloud.ui.2', 'cloud.api.2'), rel('cloud.ui', 'cloud.api.1'), 
        // same parent 1st level
        rel('cloud.ui', 'cloud.api'), 
        // no same parent
        rel('cloud.api.1', 'aws.1'), rel('cloud.api', 'aws.1'), rel('cloud.api', 'aws'), rel('cloud.ui.1', 'aws.1'), rel('cloud.ui', 'aws'), rel('cloud', 'aws'))).toEqual([
            'cloud -> aws',
            'cloud.api -> aws',
            'cloud.ui -> aws',
            'cloud.api -> aws.1',
            'cloud.api.1 -> aws.1',
            'cloud.ui.1 -> aws.1',
            'cloud.ui -> cloud.api',
            'cloud.ui -> cloud.api.1',
            'cloud.ui.1 -> cloud.api.1',
            'cloud.ui.2 -> cloud.api.2',
            'cloud.api.1 -> cloud.api.2',
            'cloud.ui.1 -> cloud.ui.2',
            'cloud.ui.2 -> cloud.ui.1',
        ]);
    });
    it('should sort relations from example', () => {
        const relations = [
            {
                source: {
                    id: 'customer',
                },
                target: {
                    id: 'cloud.frontend.dashboard',
                },
            },
            {
                source: {
                    id: 'support',
                },
                target: {
                    id: 'cloud.frontend.supportPanel',
                },
            },
            {
                source: {
                    id: 'cloud.backend.storage',
                },
                target: {
                    id: 'amazon.s3',
                },
            },
            {
                source: {
                    id: 'amazon.api',
                },
                target: {
                    id: 'cloud.backend.graphql',
                },
            },
            {
                source: {
                    id: 'cloud.backend.graphql',
                },
                target: {
                    id: 'cloud.backend.storage',
                },
            },
            {
                source: {
                    id: 'cloud.frontend.dashboard',
                },
                target: {
                    id: 'cloud.backend.graphql',
                },
            },
            {
                source: {
                    id: 'cloud.frontend.supportPanel',
                },
                target: {
                    id: 'cloud.backend.graphql',
                },
            },
        ];
        expect(sorted(...relations)).toEqual([
            'customer -> cloud.frontend.dashboard',
            'support -> cloud.frontend.supportPanel',
            'amazon.api -> cloud.backend.graphql',
            'cloud.backend.storage -> amazon.s3',
            'cloud.frontend.dashboard -> cloud.backend.graphql',
            'cloud.frontend.supportPanel -> cloud.backend.graphql',
            'cloud.backend.graphql -> cloud.backend.storage',
        ]);
    });
});
