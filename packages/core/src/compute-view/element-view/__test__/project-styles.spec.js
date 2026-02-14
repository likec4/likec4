import { describe, expect, it } from 'vitest';
import { Builder } from '../../../builder';
describe('computed nodes and edges inherit project styles', () => {
    const builder = Builder
        .specification({
        elements: {
            el: {},
            queue: {
                style: {
                    color: 'green',
                    shape: 'queue',
                },
            },
            full: {
                style: {
                    border: 'none',
                    opacity: 37,
                    size: 'xs',
                    padding: 'xs',
                },
            },
        },
    })
        .model((_, m) => m(_.el('el'), _.queue('queue'), _.full('full')))
        .views((_, v) => v(_.view('index', _.$include('*'))));
    it('inherits element styles', () => {
        const view = builder.toLikeC4Model({
            id: 'test',
            styles: {
                defaults: {
                    shape: 'browser',
                    color: 'red',
                    size: 'lg',
                },
            },
        }).view('index');
        const elnode = view.node('el');
        expect(elnode.color).toBe('red');
        expect(elnode.shape).toBe('browser');
        expect(elnode.style).toMatchInlineSnapshot(`
      {
        "opacity": 15,
        "size": "lg",
      }
    `);
        const queuenode = view.node('queue');
        expect(queuenode.color).toBe('green');
        expect(queuenode.shape).toBe('queue');
        expect(queuenode.style).toMatchInlineSnapshot(`
      {
        "opacity": 15,
        "size": "lg",
      }
    `);
        const fullnode = view.node('full');
        expect(fullnode.color).toBe('red');
        expect(fullnode.shape).toBe('browser');
        expect(fullnode.style).toMatchInlineSnapshot(`
      {
        "border": "none",
        "opacity": 37,
        "padding": "xs",
        "size": "xs",
      }
    `);
    });
    it('inherits relationship styles', () => {
        const m = builder
            .clone()
            .model((_, m) => m(_.rel('full', 'queue')))
            .toLikeC4Model({
            id: 'test',
            styles: {
                defaults: {
                    relationship: {
                        color: 'green',
                        line: 'solid',
                        arrow: 'diamond',
                    },
                },
            },
        });
        const view = m.view('index');
        const edges = [...view.edges()];
        expect(edges.length).toBe(1);
        const edge = edges[0];
        expect(edge.color).toBe('green');
        expect(edge.line).toBe('solid');
        expect(edge.head).toBe('diamond');
    });
    it('overrides relationship styles', () => {
        const m = builder
            .clone()
            .model((_, m) => m(_.rel('full', 'queue', {
            color: 'blue',
            line: 'dotted',
            head: 'dot',
        })))
            .toLikeC4Model({
            id: 'test',
            styles: {
                defaults: {
                    relationship: {
                        color: 'green',
                        line: 'solid',
                        arrow: 'diamond',
                    },
                },
            },
        });
        const view = m.view('index');
        const edges = [...view.edges()];
        expect(edges.length).toBe(1);
        const edge = edges[0];
        expect(edge.color).toBe('blue');
        expect(edge.line).toBe('dotted');
        expect(edge.head).toBe('dot');
    });
});
