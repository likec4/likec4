export declare const VIEW_FOLDERS_SEPARATOR = "/";
/**
 * Normalizes view path by removing spaces from segments, removing empty segments,
 * and removing leading/trailing slashes
 * @example
 * normalizeViewPath('One / Tw o / Thre e') === 'One/Tw o/Thre e'
 */
export declare const normalizeViewPath: (title: string) => string;
/**
 * Returns view group path if it is used as a path
 * Returns empty string if it is not a path
 * @example
 * getViewFolderPath('One / Tw o / Thre e') === 'One/Tw o'
 * getViewFolderPath('One') === ''
 */
export declare const getViewFolderPath: (title: string) => string | null;
/**
 * Returns view title if it is used as a path
 * @example
 * getViewTitleFromPath('One / Tw o / Thre e') === 'Thre e'
 * getViewTitleFromPath('One') === 'One'
 */
export declare const extractViewTitleFromPath: (title: string) => string;
