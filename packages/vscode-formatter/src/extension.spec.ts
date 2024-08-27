import { describe, vi, it, expect } from 'vitest'
import { SpaceNormalizer } from './extension';

it('inserts spaces between word and control symbol', () => {
    const normalizer = new SpaceNormalizer();
    const source = 'hello{world}';
    const edits = normalizer.normalizeSpaces({
        firstNonWhitespaceCharacterIndex: 0,
        text: source
    });

    const result = applyEdits(source, edits);
    expect(result).toBe('hello { world }');
});

it('reduces multiple spaces', () => {
    const normalizer = new SpaceNormalizer();
    const source = 'hello   {    world   }';
    const edits = normalizer.normalizeSpaces({
        firstNonWhitespaceCharacterIndex: 0,
        text: source
    });

    const result = applyEdits(source, edits);
    expect(result).toBe('hello { world }');
});

function applyEdits(source: string, edits: {start: number, end: number, newText: string}[]) {
    return edits.reduce(
        (source: string, edit) => 
            `${source.slice(0, edit.start)}${edit.newText}${source.slice(edit.end)}`
        , source);
}
