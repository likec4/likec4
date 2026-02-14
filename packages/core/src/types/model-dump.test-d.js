import { describe, expectTypeOf, it } from 'vitest';
import { _stage } from './const';
function castSpec(value) {
    return value;
}
function castModel(value) {
    return value;
}
describe('SpecTypesFromDump', () => {
    it('should convert empty SpecificationJson to SpecTypes with never types', () => {
        const emptySpec = castSpec({
            elements: {},
        });
        expectTypeOf().toEqualTypeOf();
    });
    it('should convert SpecificationJson with all fields to SpecTypes', () => {
        const spec = castSpec({
            elements: {
                'system': {},
                'container': {
                    style: {
                        size: 'md',
                    },
                },
            },
            tags: {
                'important': {
                    color: 'rgb(255, 0, 0)',
                },
                'deprecated': {
                    color: 'rgba(255, 0, 0, 0.65)',
                },
            },
            deployments: {
                'pod': {},
                'container': {},
            },
            relationships: {
                'http': {},
                'grpc': {},
            },
            metadataKeys: ['version', 'owner'],
        });
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toHaveProperty('Tag').toEqualTypeOf();
        expectTypeOf().toHaveProperty('ElementKind').toEqualTypeOf();
        expectTypeOf().toHaveProperty('DeploymentKind').toEqualTypeOf();
        expectTypeOf().toHaveProperty('RelationKind').toEqualTypeOf();
        expectTypeOf().toHaveProperty('MetadataKey').toEqualTypeOf();
    });
    it('should handle optional fields in SpecificationJson', () => {
        const spec = castSpec({
            elements: {
                'system': {},
            },
            relationships: {
                'http': {},
            },
        });
        expectTypeOf().toEqualTypeOf();
    });
    it('should return never for non-SpecificationJson types', () => {
        expectTypeOf().toEqualTypeOf();
    });
});
describe('AuxFromDump', () => {
    it('should convert empty LikeC4ModelDump to Aux with never types', () => {
        const emptyModel = castModel({
            _stage: 'computed',
            projectId: 'test-project',
            project: { id: 'test-project', config: { name: 'test-project' } },
            elements: {},
            views: {},
            deployments: {},
            specification: {
                elements: {},
            },
        });
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toBeNever();
        expectTypeOf().toBeNever();
        expectTypeOf().toBeNever();
        expectTypeOf().toBeNever();
        expectTypeOf().toBeNever();
        expectTypeOf().toBeNever();
        expectTypeOf().toBeNever();
        expectTypeOf().items.toBeNever();
        expectTypeOf().toBeNever();
    });
    it('should convert complete LikeC4ModelDump to Aux with correct types', () => {
        const model = castModel({
            _stage: 'computed',
            projectId: 'test-project',
            project: { id: 'test-project', config: { name: 'test-project' } },
            elements: {
                'element1': {},
                'element2': {},
            },
            views: {
                'view1': {},
                'view2': {},
            },
            deployments: {
                elements: {
                    'deployment1': {},
                    'deployment2': {},
                },
            },
            specification: {
                elements: {
                    'system': {},
                    'container': {},
                },
                deployments: {
                    'k8s': {},
                    'aws': {},
                },
                relationships: {
                    'http': {},
                    'grpc': {},
                },
                tags: {
                    'important': { color: 'red' },
                    'deprecated': { color: 'gray' },
                },
                metadataKeys: ['version', 'owner'],
            },
        });
        // Verify the main Aux type parameters
        expectTypeOf().toEqualTypeOf();
        // Verify individual properties
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        // Verify Spec properties
        expectTypeOf().toEqualTypeOf();
        // Verify derived types
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
    });
    it('should handle optional fields in LikeC4ModelDump', () => {
        const model = castModel({
            [_stage]: 'layouted',
            projectId: 'test-project',
            project: { id: 'test-project', config: { name: 'test-project' } },
            elements: {
                'e1': {},
                'e2': {},
                'e3': {},
            },
            views: {},
            deployments: {},
            specification: {
                elements: {
                    'system': {},
                },
                relationships: {
                    'http': {},
                },
            },
        });
        expectTypeOf().toEqualTypeOf();
    });
    it('should return default Aux type for non-LikeC4ModelDump types', () => {
        expectTypeOf().toEqualTypeOf();
    });
});
