export function isOnStage(value, stage) {
    return value[_stage] === stage;
}
/**
 * Property name to store the stage of the model
 *
 * @internal
 */
export const _stage = '_stage';
/**
 * Property name to store type information, used to identify the type of the view
 *
 * @internal
 */
export const _type = '_type';
/**
 * Property name to store layout type information, used to identify the type of the layout*
 * @internal
 */
export const _layout = '_layout';
