import { isString } from 'remeda';
import { GlobalFqn } from './scalar';
export var FqnRef;
(function (FqnRef) {
    function isElementRef(ref) {
        return 'model' in ref && !('project' in ref);
    }
    FqnRef.isElementRef = isElementRef;
    function isImportRef(ref) {
        return 'project' in ref && 'model' in ref;
    }
    FqnRef.isImportRef = isImportRef;
    function flatten(ref) {
        if (isString(ref)) {
            throw new Error(`Expected FqnRef, got: "${ref}"`);
        }
        if (isImportRef(ref)) {
            return GlobalFqn(ref.project, ref.model);
        }
        if (isElementRef(ref)) {
            return ref.model;
        }
        throw new Error('Expected FqnRef.ModelRef or FqnRef.ImportRef');
    }
    FqnRef.flatten = flatten;
    function isModelRef(ref) {
        return isElementRef(ref) || isImportRef(ref);
    }
    FqnRef.isModelRef = isModelRef;
    function isInsideInstanceRef(ref) {
        return 'deployment' in ref && 'element' in ref;
    }
    FqnRef.isInsideInstanceRef = isInsideInstanceRef;
    function isDeploymentElementRef(ref) {
        return 'deployment' in ref && !('element' in ref);
    }
    FqnRef.isDeploymentElementRef = isDeploymentElementRef;
    function isDeploymentRef(ref) {
        return isDeploymentElementRef(ref) || isInsideInstanceRef(ref);
    }
    FqnRef.isDeploymentRef = isDeploymentRef;
})(FqnRef || (FqnRef = {}));
