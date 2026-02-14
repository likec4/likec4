import { expectTypeOf, test } from 'vitest';
import { Builder } from '../builder';
import { _stage, } from '../types';
import { LikeC4Model } from './LikeC4Model';
const b = Builder.specification({
    elements: {
        actor: {},
        system: {},
        component: {},
    },
    deployments: {
        env: {},
        vm: {},
    },
    relationships: {
        like: {},
        dislike: {},
    },
    tags: {
        tag1: {},
        tag2: {},
    },
    metadataKeys: ['key1', 'key2'],
})
    .model(({ actor, system, component, relTo }, _) => _(actor('alice'), actor('bob'), system('cloud').with(component('backend').with(component('api'), component('db')), component('frontend').with(relTo('cloud.backend.api')))))
    .deployment(({ env, vm, instanceOf }, _) => _(env('prod').with(vm('vm1'), vm('vm2')), env('dev').with(vm('vm1'), instanceOf('api', 'cloud.backend.api'), vm('vm2'))))
    .views(({ view, deploymentView, $include }, _) => _(view('index', $include('*')), deploymentView('prodview', $include('*'))));
test('LikeC4Model.Parsed', () => {
    expectTypeOf({}).toEqualTypeOf();
    expectTypeOf({}).toEqualTypeOf();
    expectTypeOf({}).toEqualTypeOf();
});
test('LikeC4Model.Computed', () => {
    expectTypeOf({}).toEqualTypeOf();
    expectTypeOf({}).toEqualTypeOf();
    expectTypeOf({}).toEqualTypeOf();
    expectTypeOf({}).toEqualTypeOf();
    expectTypeOf({}).toEqualTypeOf();
    expectTypeOf({}).toEqualTypeOf();
});
test('LikeC4Model.Layouted', () => {
    expectTypeOf({}).toEqualTypeOf();
    expectTypeOf({}).toEqualTypeOf();
    expectTypeOf({}).toEqualTypeOf();
    expectTypeOf({}).toEqualTypeOf();
    expectTypeOf({}).toEqualTypeOf();
    expectTypeOf({}).toEqualTypeOf();
});
test('LikeC4Model.create: infer from Unknown', () => {
    const parsed = LikeC4Model.create({});
    expectTypeOf(parsed).toEqualTypeOf();
    expectTypeOf(parsed.stage).toEqualTypeOf();
    const computed = LikeC4Model.create({});
    expectTypeOf(computed).toEqualTypeOf();
    expectTypeOf(computed.stage).toEqualTypeOf();
    const layouted = LikeC4Model.create({});
    expectTypeOf(layouted).toEqualTypeOf();
    expectTypeOf(layouted.stage).toEqualTypeOf();
});
test('LikeC4Model.create: infer from data', () => {
    const parsedData = b.build();
    expectTypeOf(parsedData).toExtend();
    expectTypeOf(parsedData._stage).toEqualTypeOf();
    expectTypeOf().toEqualTypeOf();
    expectTypeOf().toEqualTypeOf();
    const m1 = LikeC4Model.create(parsedData);
    expectTypeOf(m1.Aux).toEqualTypeOf();
    expectTypeOf(m1.stage).toEqualTypeOf();
    expectTypeOf(m1.$data).toEqualTypeOf();
    expectTypeOf(m1.$data._stage).toEqualTypeOf();
    expectTypeOf().toEqualTypeOf();
    const computedData1 = parsedData;
    const m2 = LikeC4Model.create(computedData1);
    expectTypeOf().toEqualTypeOf();
    expectTypeOf(m2.stage).toEqualTypeOf();
    expectTypeOf(m2.$data._stage).toEqualTypeOf();
    expectTypeOf().toEqualTypeOf();
    expectTypeOf().toEqualTypeOf();
    const layoutedData = parsedData;
    const m3 = LikeC4Model.create(layoutedData);
    expectTypeOf().toEqualTypeOf();
    expectTypeOf(m3.stage).toEqualTypeOf();
    expectTypeOf(m3.$data._stage).toEqualTypeOf();
    expectTypeOf().toEqualTypeOf();
    expectTypeOf().toEqualTypeOf();
});
test('LikeC4Model created from builder', () => {
    const m = b.toLikeC4Model();
    expectTypeOf(m.stage).toEqualTypeOf();
    expectTypeOf(m.view).parameter(0).toEqualTypeOf();
    expectTypeOf(m.findView).parameter(0).toEqualTypeOf();
});
test('LikeC4Model.create: should have all types', () => {
    const { model: { model, actor, system, component, relTo, }, deployment: { deployment, instanceOf, env, vm, }, views: { deploymentView, views, view, $include, }, builder, } = Builder.forSpecification({
        elements: {
            actor: {
                style: {
                    shape: 'person',
                },
            },
            system: {},
            component: {},
        },
        deployments: {
            env: {},
            vm: {},
        },
        relationships: {
            like: {},
            dislike: {},
        },
        tags: {
            tag1: {},
            tag2: {},
        },
        metadataKeys: ['key1', 'key2'],
    });
    const source = builder
        .with(model(actor('alice'), actor('bob'), system('cloud').with(component('backend').with(component('api'), component('db')), component('frontend').with(relTo('cloud.backend.api')))), deployment(env('prod').with(vm('vm1'), vm('vm2')), env('dev').with(vm('vm1'), instanceOf('api', 'cloud.backend.api'), vm('vm2'))), views(view('index', $include('*')), deploymentView('prodview', $include('*'))))
        .build();
    const parsed = LikeC4Model.create(source);
    expectTypeOf(parsed.$data[_stage]).toEqualTypeOf();
    // Check view types
    expectTypeOf(parsed.view('index')).toBeNever();
    expectTypeOf(parsed.element('cloud').scopedViews()).toEqualTypeOf();
    // @ts-expect-error
    parsed.element('wrong');
    // should not fail
    parsed.findElement('wrong');
    expectTypeOf(parsed.element).parameter(0).toEqualTypeOf();
    const e = parsed.element('cloud.backend.api');
    expectTypeOf(e.getMetadata).parameter(0).toEqualTypeOf();
    expectTypeOf(e.getMetadata('key1')).toEqualTypeOf();
    expectTypeOf(e.getMetadata()).toEqualTypeOf();
    expectTypeOf(parsed.Aux.ElementId).toEqualTypeOf();
    expectTypeOf(parsed.Aux.ViewId).toEqualTypeOf();
    expectTypeOf(parsed.Aux.DeploymentId).toEqualTypeOf();
    expectTypeOf(parsed.Aux.ElementKind).toEqualTypeOf();
    expectTypeOf(parsed.Aux.DeploymentKind).toEqualTypeOf();
    expectTypeOf(parsed.Aux.RelationKind).toEqualTypeOf();
    expectTypeOf(parsed.Aux.Tag).toEqualTypeOf();
    expectTypeOf(parsed.Aux.MetadataKey).toEqualTypeOf();
});
test('LikeC4Model type guards', () => {
    const unknownModel = {};
    expectTypeOf(unknownModel.stage).toEqualTypeOf();
    if (unknownModel.isParsed()) {
        expectTypeOf(unknownModel).toBeNever();
    }
    if (unknownModel.isComputed()) {
        expectTypeOf(unknownModel.stage).toEqualTypeOf();
        const v = unknownModel.view('index');
        expectTypeOf(v).toEqualTypeOf();
        const node = v.node('cloud');
        expectTypeOf(node.x).toEqualTypeOf();
        expectTypeOf(node.y).toEqualTypeOf();
        expectTypeOf(node.width).toEqualTypeOf();
        expectTypeOf(node.height).toEqualTypeOf();
        if (node.isLayouted()) {
            expectTypeOf(node).toBeNever();
        }
        if (v.isLayouted()) {
            expectTypeOf(v).toBeNever();
        }
        if (v.isComputed()) {
            expectTypeOf(v).toEqualTypeOf();
        }
        expectTypeOf(unknownModel.element('cloud').defaultView).toExtend();
        expectTypeOf(unknownModel.deployment.views()).toEqualTypeOf();
    }
    if (unknownModel.isLayouted()) {
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf(unknownModel.stage).toEqualTypeOf();
        expectTypeOf(unknownModel.view('index')).toEqualTypeOf();
        const defaultView = unknownModel.element('cloud').defaultView;
        expectTypeOf(defaultView).toExtend();
        expectTypeOf(defaultView.viewOf).toEqualTypeOf();
        expectTypeOf(defaultView.$view.viewOf).toEqualTypeOf();
        const v = unknownModel.view('index');
        expectTypeOf(v).toEqualTypeOf();
        if (v.isLayouted()) {
            expectTypeOf(v).toEqualTypeOf();
        }
        if (v.isComputed()) {
            expectTypeOf(v).toBeNever();
        }
        const node = v.node('cloud');
        expectTypeOf(node.$viewModel.stage).toEqualTypeOf();
        expectTypeOf(node.x).toEqualTypeOf();
        expectTypeOf(node.y).toEqualTypeOf();
        expectTypeOf(node.width).toEqualTypeOf();
        expectTypeOf(node.height).toEqualTypeOf();
        if (node.isLayouted()) {
            expectTypeOf(node.x).toEqualTypeOf();
            expectTypeOf(node.y).toEqualTypeOf();
            expectTypeOf(node.width).toEqualTypeOf();
            expectTypeOf(node.height).toEqualTypeOf();
        }
        expectTypeOf(v.viewOf).toEqualTypeOf();
        if (v.isScopedElementView()) {
            expectTypeOf(v.viewOf).toEqualTypeOf();
        }
        if (v.isDynamicView()) {
            expectTypeOf(v).toEqualTypeOf();
        }
        if (v.isDeploymentView()) {
            expectTypeOf(v).toEqualTypeOf();
        }
        expectTypeOf(unknownModel.deployment.views()).toEqualTypeOf();
    }
    const computed = {};
    expectTypeOf(computed.view('index')).toEqualTypeOf();
    expectTypeOf(computed.element('cloud.backend.api').defaultView).toExtend();
    expectTypeOf(computed.element('cloud.backend.api').defaultView.viewOf).toEqualTypeOf();
    expectTypeOf(computed.element('cloud.backend.api').defaultView.$view.viewOf).toEqualTypeOf();
    if (computed.isComputed()) {
        expectTypeOf(computed).toEqualTypeOf();
    }
    if (computed.isLayouted()) {
        expectTypeOf(computed).toBeNever();
    }
    if (computed.isParsed()) {
        expectTypeOf(computed).toBeNever();
    }
    const layouted = {};
    if (layouted.isComputed()) {
        expectTypeOf(layouted).toBeNever();
    }
    if (layouted.isParsed()) {
        expectTypeOf(layouted).toBeNever();
    }
    const v = layouted.view('index');
    expectTypeOf(v).toEqualTypeOf();
    expectTypeOf(v.mode).toEqualTypeOf();
    if (v.isDynamicView()) {
        expectTypeOf(v._type).toEqualTypeOf();
        expectTypeOf(v.mode).toEqualTypeOf();
        expectTypeOf(v).toEqualTypeOf();
    }
    if (v.isDeploymentView()) {
        expectTypeOf(v._type).toEqualTypeOf();
        expectTypeOf(v.mode).toBeNever();
        expectTypeOf(v).toEqualTypeOf();
    }
    if (v.isElementView()) {
        expectTypeOf(v._type).toEqualTypeOf();
        expectTypeOf(v.mode).toBeNever();
        expectTypeOf(v).toEqualTypeOf();
        expectTypeOf(v.viewOf).toEqualTypeOf();
    }
    if (v.isScopedElementView()) {
        expectTypeOf(v._type).toEqualTypeOf();
        expectTypeOf(v.mode).toBeNever();
        expectTypeOf(v).toEqualTypeOf();
        expectTypeOf(v.$view).toEqualTypeOf();
        expectTypeOf(v.viewOf).toEqualTypeOf();
    }
    expectTypeOf(v.mode).toEqualTypeOf();
});
test('LikeC4Model<Any> type guards', () => {
    const m = {};
    expectTypeOf(m.stage).toEqualTypeOf();
    if (m.isParsed()) {
        expectTypeOf(m.stage).toEqualTypeOf();
        expectTypeOf(m.Aux).toEqualTypeOf();
        expectTypeOf(m.element).parameter(0).toEqualTypeOf();
        expectTypeOf(m.view).parameter(0).toEqualTypeOf();
        expectTypeOf(m.view('index')).toBeNever();
    }
    if (m.isComputed()) {
        expectTypeOf(m.stage).toEqualTypeOf();
        expectTypeOf(m.Aux).toEqualTypeOf();
        expectTypeOf(m.element).parameter(0).toEqualTypeOf();
        expectTypeOf(m.view).parameter(0).toEqualTypeOf();
        const v = m.view('index');
        expectTypeOf(v).toEqualTypeOf();
        if (v.isLayouted()) {
            expectTypeOf(v).toBeNever();
        }
    }
    if (m.isLayouted()) {
        expectTypeOf(m.stage).toEqualTypeOf();
        expectTypeOf(m.Aux).toEqualTypeOf();
        expectTypeOf(m.element).parameter(0).toEqualTypeOf();
        expectTypeOf(m.view).parameter(0).toEqualTypeOf();
        const v = m.view('index');
        expectTypeOf(v).toEqualTypeOf();
        if (v.isComputed()) {
            expectTypeOf(v).toBeNever();
        }
    }
});
test('LikeC4Model.create: should have defined types and never for missing', () => {
    const { model: { model, actor, component, }, views: { views, view, $include, }, builder, } = Builder.forSpecification({
        elements: {
            actor: {},
            component: {},
        },
        deployments: {
            env: {},
        },
    });
    const b = builder
        .with(model(actor('alice'), component('cloud'), component('cloud.frontend')), views(view('view1', $include('*'))));
    const computed = b.toLikeC4Model();
    expectTypeOf(computed.tags).toEqualTypeOf();
    expectTypeOf(computed.view).parameter(0).toEqualTypeOf();
    // @ts-expect-error
    computed.view('view2');
    expectTypeOf(computed.findView).parameter(0).toEqualTypeOf();
    expectTypeOf(computed.element).parameter(0).toEqualTypeOf();
    expectTypeOf(computed.deployment.element).parameter(0).toEqualTypeOf();
    expectTypeOf(computed.stage).toEqualTypeOf();
    if (computed.isLayouted()) {
        expectTypeOf(computed).toBeNever();
    }
    expectTypeOf(computed.view('view1')).toEqualTypeOf();
});
test('LikeC4Model.fromDump: should have types', () => {
    const m = LikeC4Model.fromDump({
        [_stage]: 'layouted',
        project: { id: 'test-project', config: { name: 'test-project' } },
        specification: {
            tags: {
                tag1: {},
                tag2: {},
            },
            elements: {
                actor: {},
                system: {},
                component: {},
            },
            relationships: {},
            deployments: {},
        },
        elements: {
            el1: {},
            el2: {},
        },
        relations: {},
        globals: {
            predicates: {},
            dynamicPredicates: {},
            styles: {},
        },
        views: {
            v1: {},
            v2: {},
        },
        deployments: {
            elements: {
                d1: {},
                d2: {},
            },
        },
    });
    expectTypeOf().toEqualTypeOf();
    expectTypeOf().toEqualTypeOf();
    expectTypeOf(m.view('v1')).toEqualTypeOf();
});
