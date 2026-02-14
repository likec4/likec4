import { describe, expect, it } from 'vitest';
import { Builder } from '../../builder';
describe('Project styles', () => {
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
        .model((_, m) => m(_.el('el'), _.queue('queue'), _.full('full', {
        color: 'blue',
        style: {
            textSize: 'xl',
        },
    })));
    it('inherit element styles', () => {
        const m = builder.toLikeC4Model({
            id: 'test',
            styles: {
                defaults: {
                    shape: 'browser',
                    color: 'red',
                    size: 'lg',
                },
            },
        });
        expect(m.element('el').shape).toBe('browser');
        expect(m.element('el').color).toBe('red');
        expect(m.element('el').style).toMatchInlineSnapshot(`
      {
        "color": "red",
        "opacity": 15,
        "shape": "browser",
        "size": "lg",
      }
    `);
        expect(m.element('queue').shape).toBe('queue');
        expect(m.element('queue').color).toBe('green');
        expect(m.element('queue').style).toMatchInlineSnapshot(`
      {
        "color": "green",
        "opacity": 15,
        "shape": "queue",
        "size": "lg",
      }
    `);
        expect(m.element('full').shape).toBe('browser');
        expect(m.element('full').color).toBe('blue');
        expect(m.element('full').style).toMatchInlineSnapshot(`
      {
        "border": "none",
        "color": "blue",
        "opacity": 37,
        "padding": "xs",
        "shape": "browser",
        "size": "xs",
        "textSize": "xl",
      }
    `);
    });
    it('inherit relationship styles', () => {
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
        const rels = [...m.relationships()];
        expect(rels.length).toBe(1);
        const rel = rels[0];
        expect(rel.color).toBe('green');
        expect(rel.line).toBe('solid');
        expect(rel.head).toBe('diamond');
    });
    it('override relationship style', () => {
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
        const rels = [...m.relationships()];
        expect(rels.length).toBe(1);
        const rel = rels[0];
        expect(rel.color).toBe('blue');
        expect(rel.line).toBe('dotted');
        expect(rel.head).toBe('dot');
    });
});
