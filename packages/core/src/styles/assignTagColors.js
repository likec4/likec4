import { DefaultTagColors } from '@likec4/style-preset/defaults';
import { concat, entries, isTruthy, map, pipe, prop, pullObject, sort } from 'remeda';
import { compareNatural } from '../utils/compare-natural';
import { nonNullable } from '../utils/invariant';
/**
 * Colors are taken from the styles presets of the LikeC4 (Radix Colors)
 */
export { DefaultTagColors };
export function assignTagColors(tags) {
    const tagsWithColors = [];
    const tagsWithoutColors = [];
    for (const [tag, spec] of entries(tags)) {
        if (isTruthy(spec.color)) {
            tagsWithColors.push({
                tag: tag,
                spec: {
                    color: spec.color,
                },
            });
        }
        else {
            tagsWithoutColors.push(tag);
        }
    }
    return pipe(tagsWithoutColors, sort(compareNatural), map((tag, idx) => {
        const color = nonNullable(DefaultTagColors[idx % DefaultTagColors.length]);
        return {
            tag,
            spec: {
                color,
            },
        };
    }), concat(tagsWithColors), sort((a, b) => compareNatural(a.tag, b.tag)), pullObject(prop('tag'), prop('spec')));
}
