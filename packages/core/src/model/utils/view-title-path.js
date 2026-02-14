import { hasAtLeast } from 'remeda';
import { invariant } from '../../utils';
export const VIEW_FOLDERS_SEPARATOR = '/';
const splitViewTitle = (title) => {
    invariant(!title.includes('\n'), 'View title cannot contain newlines');
    if (title.includes(VIEW_FOLDERS_SEPARATOR)) {
        const segments = title
            .split(VIEW_FOLDERS_SEPARATOR)
            .map(s => s.trim())
            .filter(s => s.length > 0);
        if (hasAtLeast(segments, 1)) {
            return segments;
        }
        return [''];
    }
    return [title.trim()];
};
/**
 * Normalizes view path by removing spaces from segments, removing empty segments,
 * and removing leading/trailing slashes
 * @example
 * normalizeViewPath('One / Tw o / Thre e') === 'One/Tw o/Thre e'
 */
export const normalizeViewPath = (title) => {
    return splitViewTitle(title).join(VIEW_FOLDERS_SEPARATOR);
};
/**
 * Returns view group path if it is used as a path
 * Returns empty string if it is not a path
 * @example
 * getViewFolderPath('One / Tw o / Thre e') === 'One/Tw o'
 * getViewFolderPath('One') === ''
 */
export const getViewFolderPath = (title) => {
    const segments = splitViewTitle(title);
    if (!hasAtLeast(segments, 2)) {
        return null;
    }
    return segments.slice(0, -1).join(VIEW_FOLDERS_SEPARATOR);
};
/**
 * Returns view title if it is used as a path
 * @example
 * getViewTitleFromPath('One / Tw o / Thre e') === 'Thre e'
 * getViewTitleFromPath('One') === 'One'
 */
export const extractViewTitleFromPath = (title) => {
    if (!title.includes(VIEW_FOLDERS_SEPARATOR)) {
        return title.trim();
    }
    return splitViewTitle(title).pop() ?? title;
};
