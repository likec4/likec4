import { describe, expect, it } from 'vitest';
import { Builder } from '../../../builder';
import { TestHelper } from './TestHelper';
describe('Summary field in deployment view', () => {
    const builder = Builder
        .specification({
        elements: ['el'],
        deployments: ['node'],
    })
        .model((m, _) => _(m.el('el'), m.el('el-with-summary', {
        summary: 'summary from model',
    }), m.el('el-with-description', {
        description: 'description from model',
    })))
        .deployment((d, _) => _(d.node('test')));
    describe('deployment node', () => {
        it('computed from summary field if defined', () => {
            const t = TestHelper.from(builder.clone().deployment(d => d._(d.node('node', {
                summary: 'summary',
                description: 'description',
            }))));
            const { nodes: [node] } = t.computeView(t.$include('node'));
            expect(node).toMatchObject({
                description: {
                    txt: 'summary',
                },
            });
            expect(node).not.toHaveProperty('summary');
        });
        it('computed from description field if summary is not defined', () => {
            const t = TestHelper.from(builder.clone().deployment(d => d._(d.node('node', {
                description: 'description',
            }))));
            const { nodes: [node] } = t.computeView(t.$include('node'));
            expect(node).toMatchObject({
                description: {
                    txt: 'description',
                },
            });
        });
        it('empty string if both summary and description are not defined', () => {
            const t = TestHelper.from(builder.clone().deployment(d => d._(d.node('node'))));
            const { nodes: [node] } = t.computeView(t.$include('node'));
            expect(node).not.toHaveProperty('description');
        });
    });
    describe('deployed instance', () => {
        it('computed from summary or description field if defined', () => {
            const t = TestHelper.from(builder.clone().deployment(d => d._(d.instanceOf('test.el1', 'el-with-summary', {
                summary: 'summary',
            }), d.instanceOf('test.el2', 'el-with-summary', {
                description: 'description',
            }))));
            const { nodes: [el1, el2] } = t.computeView(t.$include('test.*'));
            expect(el1).toMatchObject({
                description: {
                    txt: 'summary',
                },
            });
            expect(el1).not.toHaveProperty('summary');
            expect(el2).toMatchObject({
                description: {
                    txt: 'description',
                },
            });
            expect(el2).not.toHaveProperty('summary');
        });
        it('inherits summary from model element', () => {
            const t = TestHelper.from(builder.clone().deployment(d => d._(d.instanceOf('test.el1', 'el-with-summary'), d.instanceOf('test.el2', 'el-with-summary', {
                description: 'higher priority',
            }), d.instanceOf('test.el3', 'el-with-description'), d.instanceOf('test.el4', 'el-with-description', {
                description: 'higher priority',
            }))));
            const { nodes } = t.computeView(t.$include('test.*'));
            const descriptions = nodes.map(n => n.description ? n.description.txt : null);
            expect(descriptions).toEqual([
                'summary from model',
                'higher priority',
                'description from model',
                'higher priority',
            ]);
        });
        it('empty string if both summary and description are not defined', () => {
            const t = TestHelper.from(builder.clone().deployment(d => d._(d.instanceOf('test.el', 'el'))));
            const { nodes: [node] } = t.computeView(t.$include('test.el'));
            expect(node).not.toHaveProperty('summary');
            expect(node).not.toHaveProperty('description');
        });
    });
});
