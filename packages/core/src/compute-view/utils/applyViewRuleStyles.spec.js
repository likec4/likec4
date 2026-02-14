import { describe, expect, it } from 'vitest';
import { GroupElementKind, } from '../../types';
import { $expr } from '../element-view/__test__/fixture';
import { applyViewRuleStyles } from './applyViewRuleStyles';
function nd(id, props) {
    return { id, ...props };
}
function g(id) {
    return { id, kind: GroupElementKind };
}
function r(targets, props) {
    return {
        targets,
        style: {},
        ...props,
    };
}
describe('applyViewRuleStyles', () => {
    it('returns nodes if there are no rules', () => {
        const nodes = [nd('1'), nd('2')];
        const rules = [];
        expect(applyViewRuleStyles(rules, nodes)).toStrictEqual(nodes);
    });
    it('does not modify groups', () => {
        const groups = [g('1'), g('2')];
        const rules = [r([$expr('*')], { notation: 'some notation' })];
        expect(applyViewRuleStyles(rules, groups)).toStrictEqual(groups);
    });
    it('aplies rule if any of predicates match', () => {
        const nodes = [nd('support'), nd('customer')];
        const rules = [
            r([
                $expr('support'),
                $expr('cloud'),
            ], { notation: 'some notation' }),
        ];
        expect(applyViewRuleStyles(rules, nodes)).toStrictEqual([
            {
                ...nodes[0],
                notation: 'some notation',
            },
            nodes[1],
        ]);
    });
    it('updates properties of matched node from rule', () => {
        const nodes = [nd('support'), nd('customer')];
        const rules = [
            r([
                $expr('support'),
                $expr('cloud'),
            ], {
                notation: 'some notation',
                style: {
                    color: 'red',
                    icon: 'aws:lambda',
                    border: 'dashed',
                    shape: 'browser',
                    multiple: true,
                    opacity: 30,
                },
            }),
        ];
        expect(applyViewRuleStyles(rules, nodes)).toStrictEqual([
            {
                ...nodes[0],
                notation: 'some notation',
                color: 'red',
                icon: 'aws:lambda',
                shape: 'browser',
                style: {
                    border: 'dashed',
                    opacity: 30,
                    multiple: true,
                },
            },
            nodes[1],
        ]);
    });
    it('updates icon style properties on matched node', () => {
        const nodes = [nd('support', {
                style: {
                    iconColor: 'blue',
                    iconSize: 'sm',
                    iconPosition: 'left',
                },
            })];
        const rules = [
            r([$expr('support')], {
                style: {
                    iconColor: 'red',
                    iconSize: 'lg',
                    iconPosition: 'right',
                },
            }),
        ];
        expect(applyViewRuleStyles(rules, nodes)).toStrictEqual([
            {
                ...nodes[0],
                style: {
                    iconColor: 'red',
                    iconSize: 'lg',
                    iconPosition: 'right',
                },
            },
        ]);
    });
    it('skips nullish properties in rule', () => {
        const nodes = [nd('support', {
                notation: 'some notation',
                color: 'red',
                icon: 'aws:lambda',
                shape: 'browser',
                style: {
                    border: 'dashed',
                    opacity: 30,
                },
            })];
        expect(applyViewRuleStyles([r([$expr('*')], {})], nodes)).toStrictEqual([nodes[0]]);
        expect(applyViewRuleStyles([r([$expr('*')], { style: {} })], nodes)).toStrictEqual([nodes[0]]);
    });
});
