/**
 * Utility function to extract `id` from the given element.
 */
export const getId = (element) => {
    return typeof element === 'string' ? element : element.id;
};
