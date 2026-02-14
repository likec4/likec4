import { isReferenceToDeploymentModel } from '../utils';
import { tryOrLog } from './_shared';
export const checkElementRef = (_services) => {
    return tryOrLog((el, accept) => {
        if (isReferenceToDeploymentModel(el.modelElement)) {
            accept('error', 'Only model elements allowed here', {
                node: el,
                property: 'modelElement',
            });
        }
    });
};
