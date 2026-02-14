import { describe, it } from 'vitest';
import { darkValue, lightValue } from './__test__/theme-index';
import { computeColorValues } from './compute-color-values';
describe('compute-color-values', () => {
    it('lightColor', ({ expect }) => {
        expect(computeColorValues('#caf2ff')).toEqual(lightValue);
    });
    it('darkColor', ({ expect }) => {
        expect(computeColorValues('#1F32C4')).toEqual(darkValue);
    });
});
