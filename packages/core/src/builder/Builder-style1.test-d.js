import { expectTypeOf, test } from 'vitest';
import { Builder } from './Builder';
test('Builder types - style 1', () => {
    const { model: { model, actor, system, component, relTo, }, deployment: { deployment, instanceOf, env, vm, }, views: { deploymentView, views, view, viewOf, $rules, $include, }, builder, } = Builder.forSpecification({
        elements: {
            actor: {
                style: {
                    shape: 'person',
                },
            },
            system: {
                style: {
                    size: 'lg',
                },
            },
            component: {},
        },
        deployments: {
            env: {},
            vm: {
                style: {
                    textSize: 'sm',
                },
            },
        },
        relationships: {
            like: {},
            dislike: {},
        },
        tags: {
            tag1: {
                color: 'rgb(200, 100, 0)',
            },
            tag2: {},
        },
        metadataKeys: ['key1', 'key2'],
    });
    const b1 = builder
        .with(model(actor('alice'), actor('bob'), system('cloud').with(component('backend').with(component('api'), component('db')), component('frontend').with(relTo('cloud.backend.api')))), deployment(env('prod').with(vm('vm1')), env('prod.vm2'), env('dev').with(vm('vm1'), instanceOf('cloud.backend.api'), instanceOf('wrong', 
    // @ts-expect-error
    'non-existing'), vm('vm2'))), views(view('view', 
    // @ts-expect-error
    $include('wrong')), // rules inside
    view('view', 
    // @ts-expect-error #tag22 is not defined
    $include('cloud.backend', {
        where: 'tag is #tag22',
    })), 
    // using with
    view('view').with(
    // @ts-expect-error
    $include('wrong'), 
    // @ts-expect-error
    $style('wrong', { color: 'red' }))), views(viewOf('view-of', 'cloud.backend.api'), 
    // @ts-expect-error
    viewOf('view-of', 'wrong'), viewOf('view-of', 'cloud.backend.api', $rules($include('* -> *'), 
    // @ts-expect-error
    $include('wrong'))), viewOf('view-of', 
    // @ts-expect-error
    '-cloud.backend.api', 'Title'), viewOf('view-of', 
    // @ts-expect-error
    '-cloud.backend.api', $rules()), viewOf('view-of', 'cloud.backend.api', { title: 'asdasd' }, $rules($include('* -> *'), 
    // @ts-expect-error
    $include('wrong')))), views(deploymentView('deployment', $rules(
    // @ts-expect-error
    $include('pr'))), deploymentView('deployment', 'Title', $rules(
    // @ts-expect-error
    $include('pr'))), deploymentView('deployment').with(
    // @ts-expect-error
    $include('pr'))));
    expectTypeOf(b1.Types.Fqn).toEqualTypeOf();
    expectTypeOf(b1.Types.ViewId).toEqualTypeOf();
    expectTypeOf(b1.Types.DeploymentFqn).toEqualTypeOf();
    expectTypeOf(b1.Types.ElementKind).toEqualTypeOf();
    expectTypeOf(b1.Types.DeploymentKind).toEqualTypeOf();
    expectTypeOf(b1.Types.RelationshipKind).toEqualTypeOf();
    expectTypeOf(b1.Types.Tag).toEqualTypeOf();
    expectTypeOf(b1.Types.MetadataKey).toEqualTypeOf();
    expectTypeOf(b1.build()).toEqualTypeOf();
    const m = b1.toLikeC4Model();
    expectTypeOf(m).toEqualTypeOf();
    const { builder: b2, ..._b2 } = Builder.forSpecification(m.specification);
    const m2 = b2.with(model(actor('alice2'), actor('bob2')), deployment(env('out').with(vm('bob2')))).toLikeC4Model();
    expectTypeOf(m2).toEqualTypeOf();
});
