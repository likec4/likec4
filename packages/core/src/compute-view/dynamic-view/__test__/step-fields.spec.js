import { describe, expect, it } from 'vitest';
import { Builder } from '../../../builder/Builder';
import { computeDynamicView } from '../compute';
describe('Dynamic view step fields', () => {
    const computeEdgeFromStep = (model, stepOverrides = {}) => {
        const view = computeDynamicView(model, {
            _stage: 'parsed',
            _type: 'dynamic',
            id: 'usecase1',
            title: null,
            description: null,
            tags: null,
            links: null,
            rules: [],
            steps: [
                {
                    source: 'shopify',
                    target: 'webhook',
                    astPath: '',
                    title: null,
                    ...stepOverrides,
                },
            ],
        });
        return view.edges[0];
    };
    describe('Technology inheritance', () => {
        it('should inherit technology from model relationship', () => {
            const model = Builder
                .specification({
                elements: ['el'],
            })
                .model(({ el, rel }, _) => _(el('shopify'), el('webhook'), rel('shopify', 'webhook', {
                technology: 'HTTP Request Override',
            })))
                .toLikeC4Model();
            const edge = computeEdgeFromStep(model);
            expect(edge).toMatchObject({
                technology: 'HTTP Request Override',
            });
        });
        it('should inherit technology from specification when kind is specified', () => {
            const model = Builder
                .specification({
                elements: ['el'],
                relationships: {
                    requests: {
                        technology: 'HTTP Request',
                    },
                },
            })
                .model(({ el, rel }, _) => _(el('shopify'), el('webhook'), rel('shopify', 'webhook', {
                kind: 'requests',
            })))
                .toLikeC4Model();
            const edge = computeEdgeFromStep(model, {
                kind: 'requests',
            });
            expect(edge).toMatchObject({
                technology: 'HTTP Request',
            });
        });
        it('should use explicit step technology over model relationship', () => {
            const model = Builder
                .specification({
                elements: ['el'],
                relationships: {},
            })
                .model(({ el, rel }, _) => _(el('shopify'), el('webhook'), rel('shopify', 'webhook', {
                technology: 'HTTP Request Override',
            })))
                .toLikeC4Model();
            const edge = computeEdgeFromStep(model, {
                technology: 'Yes, this works',
            });
            expect(edge).toMatchObject({
                technology: 'Yes, this works',
            });
        });
        it('should prefer model relationship technology over specification', () => {
            const model = Builder
                .specification({
                elements: ['el'],
                relationships: {
                    requests: {
                        technology: 'HTTP Request',
                    },
                },
            })
                .model(({ el, rel }, _) => _(el('shopify'), el('webhook'), rel('shopify', 'webhook', {
                kind: 'requests',
                technology: 'HTTP Request Override',
            })))
                .toLikeC4Model();
            const edge = computeEdgeFromStep(model);
            expect(edge).toMatchObject({
                technology: 'HTTP Request Override',
            });
        });
        it('should use specification technology when step has kind but no explicit technology', () => {
            const model = Builder
                .specification({
                elements: ['el'],
                relationships: {
                    requests: {
                        technology: 'HTTP Request',
                    },
                },
            })
                .model(({ el, rel }, _) => _(el('shopify'), el('webhook'), rel('shopify', 'webhook', {
                kind: 'requests',
            })))
                .toLikeC4Model();
            const edge = computeEdgeFromStep(model, {
                kind: 'requests',
            });
            expect(edge).toMatchObject({
                technology: 'HTTP Request',
            });
        });
    });
    describe('Description inheritance', () => {
        it('should inherit description from model relationship', () => {
            const model = Builder
                .specification({
                elements: ['el'],
                relationships: {},
            })
                .model(({ el, rel }, _) => _(el('shopify'), el('webhook'), rel('shopify', 'webhook', {
                description: { txt: 'Makes HTTP request' },
            })))
                .toLikeC4Model();
            const edge = computeEdgeFromStep(model);
            expect(edge).toMatchObject({
                description: { txt: 'Makes HTTP request' },
            });
        });
        it('should use explicit step description over model relationship', () => {
            const model = Builder
                .specification({
                elements: ['el'],
                relationships: {},
            })
                .model(({ el, rel }, _) => _(el('shopify'), el('webhook'), rel('shopify', 'webhook', {
                description: { txt: 'Makes HTTP request' },
            })))
                .toLikeC4Model();
            const edge = computeEdgeFromStep(model, {
                description: { txt: 'Custom description' },
            });
            expect(edge).toMatchObject({
                description: { txt: 'Custom description' },
            });
        });
    });
    describe('Combined fields', () => {
        it('should inherit both technology and description from model', () => {
            const model = Builder
                .specification({
                elements: ['el'],
                relationships: {},
            })
                .model(({ el, rel }, _) => _(el('shopify'), el('webhook'), rel('shopify', 'webhook', {
                technology: 'HTTP Request',
                description: { txt: 'Webhook notification' },
                title: 'notifies',
            })))
                .toLikeC4Model();
            const edge = computeEdgeFromStep(model);
            expect(edge).toMatchObject({
                technology: 'HTTP Request',
                description: { txt: 'Webhook notification' },
                label: 'notifies',
            });
        });
    });
});
