import { type ComputedDeploymentView, invariant, isDeploymentView } from '@likec4/core'
import { Builder } from '@likec4/core/builder'
import { unsafeComputeView } from '@likec4/core/compute-view'
import { attribute as _ } from 'ts-graphviz'
import { describe, it } from 'vitest'
import { DeploymentViewPrinter } from './DeploymentViewPrinter'

describe('DeploymentViewPrinter', () => {
  const model = Builder
    .specification({
      elements: {
        el: {},
      },
      deployments: {
        node: {},
      },
    })
    .model(({ el, rel }, _) =>
      _(
        el('client'),
        el('cloud'),
        el('cloud.ui'),
        el('cloud.backend'),
        el('cloud.backend.api'),
        el('cloud.db'),
        rel('client', 'cloud.ui', {
          title: 'uses',
        }),
        rel('cloud.ui', 'cloud.backend.api', {
          title: 'fetches',
          technology: 'REST',
        }),
        rel('cloud.backend.api', 'cloud.db', {
          title: 'very very very long title that should be wrapped to multiple lines',
        }),
      )
    )
    .deployment(({ node, instanceOf }, _) =>
      _(
        node('client').with(
          instanceOf('client'),
        ),
        node('z1'),
        node('z1.s1').with(
          instanceOf('cloud.ui'),
          instanceOf('cloud.backend.api'),
        ),
        node('z1.s2').with(
          instanceOf('cloud.ui'),
          instanceOf('cloud.backend.api'),
        ),
        instanceOf('z1.db', 'cloud.db'),
      )
    )
    .views(({ deploymentView, $include }, _) =>
      _(
        deploymentView('index').with(
          $include('*'),
          $include('z1.**'),
        ),
      )
    )
    .toLikeC4Model()

  it('print deployment view', async ({ expect }) => {
    const computedIndexView = model.view('index').$view as ComputedDeploymentView
    const dot = new DeploymentViewPrinter(computedIndexView, model.$styles).print()
    await expect(dot).toMatchFileSnapshot('__snapshots__/DeploymentViewPrinter-index.dot')
  })

  it('prints deployment groups as nested clusters with deployment nodes and edges', ({ expect }) => {
    const view = unsafeComputeView<typeof model.Aux>({
      _type: 'deployment',
      _stage: 'parsed',
      id: model.view('index').id,
      title: null,
      description: null,
      rules: [{
        title: 'Services',
        color: 'amber',
        border: 'solid',
        opacity: 20,
        groupRules: [{
          include: [{ ref: { deployment: 'z1.s1' } }, { ref: { deployment: 'z1.s2' } }],
        }, {
          title: 'First server',
          groupRules: [{ include: [{ ref: { deployment: 'z1.s1' }, selector: 'children' }] }],
        }, {
          title: 'Second server',
          groupRules: [{ include: [{ ref: { deployment: 'z1.s2' }, selector: 'children' }] }],
        }],
      }],
    }, model)
    invariant(isDeploymentView(view))
    const dot = new DeploymentViewPrinter(view, model.$styles).print()
    expect(dot).toContain('likec4_id = "@gr1"')
    expect(dot).toContain('likec4_id = "@gr2"')
    expect(dot).toContain('likec4_id = "@gr3"')
    expect(dot).toContain('<B>SERVICES</B>')
    expect(dot).toContain('<B>FIRST SERVER</B>')
    expect(dot).toContain('<B>SECOND SERVER</B>')
    expect(view.edges.length).toBeGreaterThan(0)
  })

  it('prints layer groups and their nodes inside an explicitly included deployment cluster', ({ expect }) => {
    const view = unsafeComputeView<typeof model.Aux>({
      _type: 'deployment',
      _stage: 'parsed',
      id: model.view('index').id,
      title: null,
      description: null,
      rules: [
        { include: [{ ref: { deployment: 'z1' } }] },
        {
          title: 'Layer 2',
          groupRules: [{ include: [{ ref: { deployment: 'z1.s1' } }, { ref: { deployment: 'z1.s2' } }] }],
        },
        {
          title: 'Layer 3',
          groupRules: [{ include: [{ ref: { deployment: 'z1.db' } }] }],
        },
      ],
    }, model)
    invariant(isDeploymentView(view))
    const printer = new DeploymentViewPrinter(view, model.$styles)
    const dot = printer.print()
    const boundary = printer.G.subgraphs.find(cluster => cluster.get(_.likec4_id) === 'z1')
    invariant(boundary)
    expect(boundary.subgraphs.map(cluster => cluster.get(_.likec4_id))).toEqual(['@gr1', '@gr2'])
    const layer2 = boundary.subgraphs.find(cluster => cluster.get(_.likec4_id) === '@gr1')
    const layer3 = boundary.subgraphs.find(cluster => cluster.get(_.likec4_id) === '@gr2')
    invariant(layer2 && layer3)
    const leafIds = (cluster: typeof layer2) =>
      cluster.nodes.map(node => printer.G.nodes.find(global => global.id === node.id)?.attributes.get(_.likec4_id))
    expect(leafIds(layer2)).toEqual(['z1.s1', 'z1.s2'])
    expect(leafIds(layer3)).toEqual(['z1.db'])
    expect(dot).toContain('<B>LAYER 2</B>')
    expect(dot).toContain('<B>LAYER 3</B>')
  })

  it('prints back direction edges reversed', ({ expect }) => {
    const m = Builder
      .specification({
        elements: { el: {} },
        deployments: { node: {} },
      })
      .model(({ el, rel }, _) =>
        _(
          el('consumer'),
          el('producer'),
          rel('consumer', 'producer', { title: 'subscribes', direction: 'back' }),
        )
      )
      .deployment(({ node, instanceOf }, _) =>
        _(
          node('n1').with(
            instanceOf('consumer'),
          ),
          node('n2').with(
            instanceOf('producer'),
          ),
        )
      )
      .views(({ deploymentView, $include }, _) =>
        _(
          deploymentView('index').with(
            $include('*'),
          ),
        )
      )
      .toLikeC4Model()
    const view = m.view('index').$view as ComputedDeploymentView
    const viewEdge = view.edges.find(e => e.label === 'subscribes')
    invariant(viewEdge)
    expect(viewEdge).toMatchObject({
      source: 'n1',
      target: 'n2',
      dir: 'back',
    })
    const printer = new DeploymentViewPrinter(view, m.$styles)
    printer.print()
    const nodeId = (id: string) => printer.G.nodes.find(n => n.attributes.get(_.likec4_id) === id)?.id
    const edge = printer.G.edges.find(e => e.attributes.get(_.likec4_id) === viewEdge.id)
    invariant(edge)
    expect(edge.targets.map(t => 'id' in t ? t.id : null)).toEqual([nodeId('n2'), nodeId('n1')])
    expect(edge.attributes.get(_.dir)).toBe('back')
    expect(edge.attributes.get(_.arrowtail)).toBe('normal')
    expect(edge.attributes.get(_.arrowhead)).toBeUndefined()
  })
})
