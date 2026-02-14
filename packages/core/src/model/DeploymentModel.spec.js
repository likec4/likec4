import { map, prop } from 'remeda';
import { describe, it } from 'vitest';
import { Builder } from '../builder';
describe('LikeC4DeploymentModel', () => {
    const model = Builder
        .specification({
        elements: {
            el: {},
            elWithTags: {
                tags: ['tag1'],
            },
        },
        relationships: {
            req: {
                technology: 'HTTP',
            },
        },
        deployments: {
            nd: {},
            vm: {
                tags: ['tag1'],
            },
        },
        tags: {
            tag1: {},
            tag2: {},
            tag3: {},
        },
    })
        .model(({ el, elWithTags, rel }, _) => _(el('customer'), el('cloud'), el('cloud.ui', {
        title: 'UI',
    }), elWithTags('cloud.backend', {
        tags: ['tag2'],
    }), el('infra'), el('infra.db'), rel('customer', 'cloud'), rel('customer', 'cloud.ui'), rel('cloud.backend', 'infra.db'), rel('cloud.ui', 'cloud.backend'), rel('cloud', 'infra')))
        .deployment(({ nd, vm, instanceOf, rel }, d) => d(nd('customer').with(instanceOf('customer')), nd('prod'), nd('prod.z1').with(vm('vm1').with(instanceOf('ui', 'cloud.ui', {
        title: 'Prod/Zone 1/UI',
    })), vm('vm2', {
        tags: ['tag2'],
    }).with(instanceOf('backend-with-tags', 'cloud.backend', {
        tags: ['tag3'],
    }))), nd('prod.z2').with(vm('vm1').with(instanceOf('cloud.ui')), vm('vm2').with(instanceOf('cloud.backend'))), nd('prod.infra').with(instanceOf('infra.db')), rel('prod.z1.vm1', 'prod.z1.vm2', {
        kind: 'req',
    })))
        .views(({ viewOf, deploymentView, $include }, _) => _(viewOf('index', 'cloud').with($include('*')), deploymentView('prod').with($include('*'), $include('prod.**'))))
        .toLikeC4Model();
    const d = model.deployment;
    it('roots', ({ expect }) => {
        expect(d.roots()).to.have.same.members([
            d.element('customer'),
            d.element('prod'),
        ]);
    });
    it('instance ref', ({ expect }) => {
        const el = d.instance('prod.z1.vm1.ui');
        expect(el.element).toBe(model.element('cloud.ui'));
        // Instance title is not inherited from the element
        expect(el.title).toBe('Prod/Zone 1/UI');
        const el2 = d.instance('prod.z2.vm1.ui');
        expect(el2.element).toBe(model.element('cloud.ui'));
        // Instance title is inherited from the element
        expect(el2.title).toBe('UI');
    });
    it('parent and children', ({ expect }) => {
        const el = d.instance('prod.z1.vm1.ui');
        expect(el.parent).toBe(d.node('prod.z1.vm1'));
        expect(el.parent.children()).to.have.same.members([
            d.element('prod.z1.vm1.ui'),
        ]);
        expect(d.node('prod.z1').children()).to.have.same.members([
            d.element('prod.z1.vm1'),
            d.element('prod.z1.vm2'),
        ]);
    });
    it('element deployments', ({ expect }) => {
        expect(model.element('cloud.ui').deployments()).to.have.same.members([
            d.instance('prod.z1.vm1.ui'),
            d.instance('prod.z2.vm1.ui'),
        ]);
    });
    it('deployment node tags', ({ expect }) => {
        expect(d.node('prod.z1.vm1').tags).toEqual([
            'tag1',
        ]);
        expect(d.node('prod.z1.vm2').tags).toEqual([
            'tag2',
            'tag1',
        ]);
    });
    it('deployment instance tags', ({ expect }) => {
        // Ensure Element tags
        expect(model.element('cloud.backend').tags).toEqual([
            'tag2',
            'tag1',
        ]);
        expect(d.element('prod.z1.vm2.backend-with-tags').isInstance()).toBe(true);
        // Ensure Instance tags are inherited from the element
        expect(d.element('prod.z1.vm2.backend-with-tags').tags).toEqual([
            'tag3',
            'tag2',
            'tag1',
        ]);
        expect(d.element('prod.z2.vm2.backend').tags).toEqual([
            'tag2',
            'tag1',
        ]);
        // Check memoization
        const tags1 = d.element('prod.z1.vm2.backend-with-tags').tags;
        const tags2 = d.element('prod.z1.vm2.backend-with-tags').tags;
        expect(tags1).toBe(tags2);
        const tags3 = d.element('prod.z2.vm2.backend').tags;
        expect(tags3).not.toBe(tags2);
    });
    it('views with instance', ({ expect }) => {
        const [view] = [...model.deployment.instance('customer.customer').views()];
        expect(view).toBeDefined();
        // View includes parent of the instance, not the instance itself
        // But still returned as a view of the instance
        expect(view.includesDeployment('customer')).toBe(true);
        expect(view.includesDeployment('customer.customer')).toBe(false);
    });
    // it('deployment view node titles', ({ expect }) => {
    //   const view = model.view('prod')
    //   invariant(view.isDeploymentView())
    //   expect([...view.nodes()].map(n => n.title)).toEqual([
    //     'customer',
    //     'prod',
    //     'prod.z1.vm1.ui',
    //     'prod.z1.vm2',
    //     'prod.z2.vm1.ui',
    //     'prod.z2.vm2',
    //     'prod.infra',
    //   ])
    // })
    it('deployment relationship must derive technology from kind', ({ expect }) => {
        const rels = [...d.relationships()];
        expect(map(rels, prop('expression')), 'deployment model has only 1 relationship').toEqual([
            'prod.z1.vm1 -> prod.z1.vm2',
        ]);
        const r = rels[0];
        expect(r.kind).toBe('req');
        expect(r.technology, 'must derive from kind').toBe('HTTP');
    });
});
