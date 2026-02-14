import { describe, expect, it } from 'vitest';
import { mergePropsFromRelationships } from './merge-props-from-relationships';
function relationship({ description, ...props } = {}) {
    if (typeof description === 'string') {
        description = { txt: description };
    }
    return {
        id: 'rel',
        source: 'source',
        target: 'target',
        ...(description && { description }),
        ...props,
    };
}
function deploymentRelationship({ description, ...props } = {}) {
    if (typeof description === 'string') {
        description = { txt: description };
    }
    return {
        id: 'rel',
        source: 'source',
        target: 'target',
        ...(description && { description }),
        ...props,
    };
}
describe('mergePropsFromRelationships', () => {
    it('should return empty object when merging empty array', () => {
        const result = mergePropsFromRelationships([]);
        expect(result).toEqual({});
    });
    it('should merge single relationship', () => {
        const rel = relationship({
            title: 'API Call',
            description: 'Makes HTTP request',
            technology: 'REST',
            kind: 'http',
            color: 'blue',
            line: 'solid',
            head: 'arrow',
            tail: 'none',
        });
        const result = mergePropsFromRelationships([rel]);
        expect(result).toEqual({
            title: 'API Call',
            description: { txt: 'Makes HTTP request' },
            technology: 'REST',
            kind: 'http',
            color: 'blue',
            line: 'solid',
            head: 'arrow',
            tail: 'none',
        });
    });
    it('should merge multiple relationships with same properties', () => {
        const rel1 = relationship({
            title: 'API Call',
            technology: 'REST',
            color: 'blue',
        });
        const rel2 = relationship({
            title: 'API Call',
            technology: 'REST',
            color: 'green',
        });
        const result = mergePropsFromRelationships([rel1, rel2]);
        expect(result).toEqual({
            title: 'API Call',
            technology: 'REST',
        });
        expect(result).not.toHaveProperty('color');
    });
    it('should use [...] for title when multiple different titles exist', () => {
        const rel1 = relationship({ title: 'Title 1' });
        const rel2 = relationship({ title: 'Title 2' });
        const result = mergePropsFromRelationships([rel1, rel2]);
        expect(result).toHaveProperty('title', '[...]');
    });
    it('should return technology for title when no titles exist', () => {
        const rel1 = relationship({ technology: 'REST' });
        const rel2 = relationship({ technology: 'REST' });
        const result = mergePropsFromRelationships([rel1, rel2]);
        expect(result).not.toHaveProperty('technology');
        expect(result).toEqual({
            title: '[REST]',
        });
    });
    it('should collect unique values for each property', () => {
        const rel1 = relationship({
            title: 'Title 1',
            technology: 'REST',
            kind: 'http',
        });
        const rel2 = relationship({
            title: 'Title 2',
            technology: 'GraphQL',
            kind: 'websocket',
        });
        const result = mergePropsFromRelationships([rel1, rel2]);
        expect(result).not.toHaveProperty('technology');
        expect(result).not.toHaveProperty('kind');
    });
    it('should merge tags from multiple relationships', () => {
        const rel1 = relationship({
            title: 'API',
            tags: ['tag1', 'tag2'],
        });
        const rel2 = relationship({
            title: 'API',
            tags: ['tag2', 'tag3'],
        });
        const result = mergePropsFromRelationships([rel1, rel2]);
        expect(result).toEqual({
            title: 'API',
            tags: ['tag1', 'tag2', 'tag3'],
        });
    });
    it('should deduplicate tags', () => {
        const rel1 = relationship({
            tags: ['tag1', 'tag1', 'tag2'],
        });
        const rel2 = relationship({
            tags: ['tag2', 'tag3'],
        });
        const result = mergePropsFromRelationships([rel1, rel2]);
        expect(result.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });
    it('should not include tags if empty', () => {
        const rel1 = relationship({ title: 'API' });
        const rel2 = relationship({ title: 'API' });
        const result = mergePropsFromRelationships([rel1, rel2]);
        expect(result).not.toHaveProperty('tags');
    });
    it('should merge navigateTo property', () => {
        const rel1 = relationship({ navigateTo: 'view1' });
        const rel2 = relationship({ navigateTo: 'view1' });
        const result = mergePropsFromRelationships([rel1, rel2]);
        expect(result).toEqual({
            navigateTo: 'view1',
        });
    });
    it('should return undefined for navigateTo when multiple different values', () => {
        const rel1 = relationship({ navigateTo: 'view1' });
        const rel2 = relationship({ navigateTo: 'view2' });
        const result = mergePropsFromRelationships([rel1, rel2]);
        expect(result).not.toHaveProperty('navigateTo');
    });
    it('should prefer properties from preferred relationship', () => {
        const rel1 = relationship({
            title: 'Title 1',
            technology: 'REST',
            head: 'diamond',
            color: 'blue',
        });
        const rel2 = relationship({
            title: 'Title 2',
            technology: 'GraphQL',
            color: 'red',
        });
        const prefer = relationship({
            title: 'Preferred Title',
            technology: 'WebSocket',
            line: 'dashed',
        });
        const result = mergePropsFromRelationships([rel1, rel2], prefer);
        expect(result).toEqual({
            title: 'Preferred Title',
            head: 'diamond',
            technology: 'WebSocket',
            line: 'dashed',
        });
    });
    it('should merge prefer with collected properties', () => {
        const rel1 = relationship({
            title: 'Title 1',
            color: 'blue',
        });
        const rel2 = relationship({
            title: 'Title 1',
            color: 'blue',
        });
        const prefer = relationship({
            technology: 'WebSocket',
        });
        const result = mergePropsFromRelationships([rel1, rel2], prefer);
        expect(result).toEqual({
            title: 'Title 1',
            color: 'blue',
            technology: 'WebSocket',
        });
    });
    it('should set title to technology if title is null and technology exists', () => {
        const rel1 = relationship({
            technology: 'REST',
            color: 'blue',
        });
        const rel2 = relationship({
            technology: 'REST',
            color: 'blue',
        });
        const result = mergePropsFromRelationships([rel1, rel2]);
        expect(result).toEqual({
            title: '[REST]',
            color: 'blue',
        });
        expect(result).not.toHaveProperty('technology');
    });
    it('should not set title to technology if title already exists', () => {
        const rel1 = relationship({
            title: 'API Call',
            technology: 'REST',
        });
        const rel2 = relationship({
            title: 'API Call',
            technology: 'REST',
        });
        const result = mergePropsFromRelationships([rel1, rel2]);
        expect(result).toEqual({
            title: 'API Call',
            technology: 'REST',
        });
    });
    it('should handle description with deep equality check', () => {
        const desc = { txt: 'Description' };
        const rel1 = relationship({ description: desc });
        const rel2 = relationship({ description: { txt: 'Description' } });
        const result = mergePropsFromRelationships([rel1, rel2]);
        expect(result).toEqual({
            description: desc,
        });
    });
    it('should handle different descriptions', () => {
        const rel1 = relationship({ description: { txt: 'Desc 1' } });
        const rel2 = relationship({ description: { txt: 'Desc 2' } });
        const result = mergePropsFromRelationships([rel1, rel2]);
        expect(result).not.toHaveProperty('description');
    });
    it('should work with deployment relationships', () => {
        const rel1 = deploymentRelationship({
            title: 'Deploy',
            technology: 'Docker',
            kind: 'deployment',
        });
        const rel2 = deploymentRelationship({
            title: 'Deploy',
            technology: 'Docker',
            kind: 'deployment',
        });
        const result = mergePropsFromRelationships([rel1, rel2]);
        expect(result).toEqual({
            title: 'Deploy',
            technology: 'Docker',
            kind: 'deployment',
        });
    });
    it('should mix regular and deployment relationships', () => {
        const rel1 = relationship({
            title: 'Call',
            color: 'blue',
        });
        const rel2 = deploymentRelationship({
            title: 'Call',
            color: 'blue',
        });
        const result = mergePropsFromRelationships([rel1, rel2]);
        expect(result).toEqual({
            title: 'Call',
            color: 'blue',
        });
    });
    it('should handle all arrow and line types', () => {
        const rel1 = relationship({
            head: 'arrow',
            tail: 'diamond',
            line: 'solid',
        });
        const rel2 = relationship({
            head: 'arrow',
            tail: 'diamond',
            line: 'solid',
        });
        const result = mergePropsFromRelationships([rel1, rel2]);
        expect(result).toEqual({
            head: 'arrow',
            tail: 'diamond',
            line: 'solid',
        });
    });
    it('should ignore null and undefined values', () => {
        const rel1 = relationship({
            title: 'Title',
            description: null,
            technology: undefined,
        });
        const rel2 = relationship({
            title: 'Title',
        });
        const result = mergePropsFromRelationships([rel1, rel2]);
        expect(result).toEqual({
            title: 'Title',
        });
    });
    it('should prefer null description from preferred relationship, if title set', () => {
        const rel1 = relationship({
            title: 'Title',
            description: 'Description 1',
        });
        const prefer = relationship({
            title: 'Preferred',
            description: null,
        });
        const result = mergePropsFromRelationships([rel1], prefer);
        expect(result).toEqual({
            title: 'Preferred',
        });
    });
    it('should handle complex merge scenario', () => {
        const rel1 = relationship({
            title: 'API Call',
            technology: 'REST',
            kind: 'http',
            color: 'blue',
            tags: ['api', 'public'],
        });
        const rel2 = relationship({
            title: 'API Call',
            technology: 'REST',
            line: 'solid',
            head: 'arrow',
            tags: ['public', 'sync'],
        });
        const rel3 = relationship({
            title: 'API Call',
            kind: 'http',
            tail: 'none',
            navigateTo: 'apiView',
            tags: ['api'],
        });
        const result = mergePropsFromRelationships([rel1, rel2, rel3]);
        expect(result).toEqual({
            title: 'API Call',
            technology: 'REST',
            kind: 'http',
            color: 'blue',
            line: 'solid',
            head: 'arrow',
            tail: 'none',
            navigateTo: 'apiView',
            tags: ['api', 'public', 'sync'],
        });
    });
});
