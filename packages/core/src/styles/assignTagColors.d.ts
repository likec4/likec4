import { DefaultTagColors } from '@likec4/style-preset/defaults';
import type { TagSpecification } from '../types';
import type { Tag } from '../types/scalar';
/**
 * Colors are taken from the styles presets of the LikeC4 (Radix Colors)
 */
export { DefaultTagColors };
export declare function assignTagColors(tags: {
    [kind: string]: Partial<TagSpecification>;
}): Record<Tag, TagSpecification>;
