import { describe, expect, it } from 'vitest'
import { Builder } from '../../../builder'
import { LikeC4Model } from '../../../model'
import type {
  DeploymentFqn,
  DeploymentViewRule,
  DeploymentViewRuleGroup,
  ParsedLikeC4ModelData,
  UnknownParsed,
  ViewId,
} from '../../../types'
import { computeView } from '../../compute-view'
import { computeDeploymentView } from '../compute'

const builder = Builder
  .specification({ elements: { component: {} }, deployments: { node: {} } })
  .model(({ component, rel }, _) =>
    _(
      component('app'),
      component('api'),
      rel('app', 'api', { title: 'requests' }),
      rel('app', 'api', { title: 'updates' }),
    )
  )
  .deployment(({ node, instanceOf }, _) =>
    _(
      node('prod').with(
        instanceOf('app1', 'app'),
        instanceOf('app2', 'app'),
        instanceOf('api', 'api'),
      ),
      node('external'),
    )
  )

const data: ParsedLikeC4ModelData = builder.build()
const model = LikeC4Model.fromParsed(data)
const multiRootData: ParsedLikeC4ModelData = builder
  .deployment(({ node, instanceOf }, _) => _(node('t_hive').with(instanceOf('app', 'app'))))
  .build()
const multiRootModel = LikeC4Model.fromParsed(multiRootData)
const ref = (id: string) => ({ ref: { deployment: id as DeploymentFqn } })
const include = (...ids: string[]): DeploymentViewRule<UnknownParsed> => ({ include: ids.map(ref) })
const group = (
  title: string | null,
  groupRules: DeploymentViewRuleGroup<UnknownParsed>['groupRules'],
  style: Omit<DeploymentViewRuleGroup<UnknownParsed>, 'title' | 'groupRules'> = {},
): DeploymentViewRuleGroup<UnknownParsed> => ({ title, groupRules, ...style })
const computeWithModel = (model: LikeC4Model<UnknownParsed>, ...rules: DeploymentViewRule<UnknownParsed>[]) =>
  computeDeploymentView(model, {
    _type: 'deployment',
    _stage: 'parsed',
    id: 'test' as ViewId,
    title: null,
    description: null,
    rules,
  })
const compute = (...rules: DeploymentViewRule<UnknownParsed>[]) => computeWithModel(model, ...rules)
const parents = (view: ReturnType<typeof compute>) => Object.fromEntries(view.nodes.map(n => [n.id, n.parent]))

describe('deployment groups', () => {
  it('groups instances of the same logical element independently and preserves group styles', () => {
    const view = compute(
      group('Primary', [include('prod.app1')], { color: 'amber', border: 'solid', opacity: 20 }),
      group('Secondary', [include('prod.app2')]),
      group(null, []),
    )
    expect(parents(view)).toEqual({
      '@gr1': null,
      '@gr2': null,
      '@gr3': null,
      'prod.app1': '@gr1',
      'prod.app2': '@gr2',
    })
    expect(view.nodes.find(n => n.id === '@gr1')).toMatchObject({
      title: 'Primary',
      kind: '@group',
      color: 'amber',
      style: { border: 'solid', opacity: 20 },
      children: ['prod.app1'],
      depth: 1,
    })
    expect(view.nodes.find(n => n.id === '@gr3')).toMatchObject({ title: '', children: [] })
  })

  it('keeps explicit nodes in their first group, including the root', () => {
    const view = compute(
      include('prod.app1'),
      group('Outer', [
        include('prod.app1', 'prod.app2'),
        group('Inner', [include('prod.app2', 'prod.api')]),
      ]),
    )
    expect(parents(view)).toMatchObject({
      '@gr2': '@gr1',
      'prod.app1': null,
      'prod.app2': '@gr1',
      'prod.api': '@gr2',
    })
  })

  it('allows excluding and reincluding nodes in a different group', () => {
    const view = compute(
      group('First', [include('prod.app1')]),
      group('Second', [{ exclude: [ref('prod.app1')] }, include('prod.app1')]),
    )
    expect(parents(view)['prod.app1']).toBe('@gr2')
    expect(view.nodes.find(n => n.id === '@gr1')?.children).toEqual([])
  })

  it('uses the latest group for relationship predicates and reparents edges', () => {
    const relation = { source: ref('prod.app1'), target: ref('prod.api') }
    const view = compute(
      group('Outer', [
        { include: [relation] },
        group('Inner', [{ include: [relation] }]),
      ]),
    )
    expect(parents(view)).toMatchObject({ 'prod.app1': '@gr2', 'prod.api': '@gr2' })
    expect(view.edges).toHaveLength(1)
    expect(view.edges[0]).toMatchObject({ source: 'prod.app1', target: 'prod.api', parent: '@gr2' })
    expect(view.nodes.find(n => n.id === '@gr2')).toMatchObject({
      parent: '@gr1',
      children: ['prod.app1', 'prod.api'],
    })
  })

  it('honors multiple relationship overrides inside nested groups', () => {
    const view = compute(group('Outer', [
      group('Inner', [
        { include: [{ source: ref('prod.app1'), target: ref('prod.api') }] },
        {
          include: [{
            customRelation: {
              expr: { source: ref('prod.app1'), target: ref('prod.api') },
              multiple: true,
            },
          }],
        },
      ]),
    ]))
    expect(view.edges).toHaveLength(2)
    expect(view.edges.map(edge => edge.label).sort()).toEqual(['requests', 'updates'])
    expect(view.edges.every(edge => edge.parent === '@gr2')).toBe(true)
  })

  it('nests groups inside explicitly included deployment parents', () => {
    const view = compute(
      group('Parent', [include('prod')]),
      group('Child', [include('prod.app1')]),
    )
    expect(parents(view)).toMatchObject({ prod: '@gr1', '@gr2': 'prod', 'prod.app1': '@gr2' })
  })

  it('nests groups inside ancestors added by includeAncestors', () => {
    const view = compute(
      group('Application', [include('prod.app1')]),
      { includeAncestors: true },
    )
    expect(parents(view)).toMatchObject({ prod: null, '@gr1': 'prod', 'prod.app1': '@gr1' })
  })

  it('places sibling layer groups and their nodes inside an included deployment boundary', () => {
    const view = compute(
      include('external', 'prod'),
      group('Layer 2', [include('prod.app1', 'prod.app2')]),
      group('Layer 3', [include('prod.api')]),
    )
    expect(parents(view)).toEqual({
      prod: null,
      external: null,
      '@gr1': 'prod',
      '@gr2': 'prod',
      'prod.app1': '@gr1',
      'prod.app2': '@gr1',
      'prod.api': '@gr2',
    })
    expect(view.nodes.find(n => n.id === 'prod')).toMatchObject({
      children: ['@gr1', '@gr2'],
      level: 0,
      depth: 2,
    })
    expect(view.nodes.find(n => n.id === '@gr1')).toMatchObject({
      children: ['prod.app1', 'prod.app2'],
      level: 1,
      depth: 1,
    })
    expect(view.nodes.find(n => n.id === 'prod.app1')?.level).toBe(2)
    expect(view.edges).toHaveLength(2)
    expect(view.edges.every(edge => edge.parent === 'prod')).toBe(true)
    for (const node of view.nodes.filter(node => node.parent !== null)) {
      expect(view.nodes.findIndex(n => n.id === node.parent)).toBeLessThan(view.nodes.indexOf(node))
    }
  })

  it('preserves deployment parents included in the same group as their children', () => {
    const view = compute(group('Application', [include('prod', 'prod.app1')]))
    expect(parents(view)).toMatchObject({ '@gr1': null, prod: '@gr1', 'prod.app1': 'prod' })
  })

  it('preserves nested group containment inside a shared deployment parent', () => {
    const view = compute(
      include('prod'),
      group('Layers', [
        group('Layer 2', [include('prod.app1', 'prod.app2')]),
        group('Layer 3', [include('prod.api')]),
      ]),
    )
    expect(parents(view)).toMatchObject({
      prod: null,
      '@gr1': 'prod',
      '@gr2': '@gr1',
      '@gr3': '@gr1',
      'prod.app1': '@gr2',
      'prod.api': '@gr3',
    })
    expect(view.nodes.find(n => n.id === 'prod')?.depth).toBe(3)
  })

  const nestedData: ParsedLikeC4ModelData = Builder
    .specification({ elements: { component: {} }, deployments: { node: {} } })
    .model(({ component, rel }, _) => _(component('app'), component('api'), rel('app', 'api')))
    .deployment(({ node, instanceOf }, _) =>
      _(
        node('prod').with(
          node('left').with(instanceOf('app', 'app'), instanceOf('api', 'api')),
          node('right').with(instanceOf('app', 'app'), instanceOf('api', 'api')),
        ),
      )
    )
    .build()
  const nestedModel = LikeC4Model.fromParsed(nestedData)

  it('rejects group members with different visible parents even when they share an ancestor', () => {
    expect(() =>
      computeWithModel(
        nestedModel,
        include('prod', 'prod.left', 'prod.right'),
        group('Services', [include('prod.left.app', 'prod.right.app')]),
      )
    ).toThrow(
      'Cannot place deployment group "Services": members "prod.left.app" and "prod.right.app" have different '
        + 'deployment parents ("prod.left" and "prod.right").',
    )
  })

  it('rejects a layer group spanning separate deployment roots', () => {
    expect(() =>
      computeWithModel(
        multiRootModel,
        include('prod', 't_hive'),
        group('Layer 2', [
          include('prod.app1'),
          { include: [{ ...ref('t_hive'), selector: 'children' }] },
        ]),
      )
    ).toThrow(
      'Cannot place deployment group "Layer 2": members "prod.app1" and "t_hive.app" have different '
        + 'deployment parents ("prod" and "t_hive").',
    )
  })

  it('rejects different deployment parents even when those parents are not visible', () => {
    expect(() =>
      computeWithModel(
        multiRootModel,
        group('Layer 2', [
          include('prod.app1'),
          { include: [{ ...ref('t_hive'), selector: 'children' }] },
        ]),
      )
    ).toThrow('deployment parents ("prod" and "t_hive")')
  })

  it('returns an explicit computation failure instead of a cross-parent diagram', () => {
    const result = computeView({
      _type: 'deployment',
      _stage: 'parsed',
      id: 'test' as ViewId,
      title: null,
      description: null,
      rules: [
        include('prod', 't_hive'),
        group('Layer 2', [
          include('prod.app1'),
          { include: [{ ...ref('t_hive'), selector: 'children' }] },
        ]),
      ],
    }, multiRootModel)
    expect(result.isSuccess).toBe(false)
    expect(result.view).toBeUndefined()
    expect(result.error?.message).toContain('Cannot place deployment group "Layer 2"')
    expect(result.error?.message).toContain('deployment parents ("prod" and "t_hive")')
  })

  it('rejects cross-parent selections inside nested groups', () => {
    expect(() =>
      computeWithModel(
        nestedModel,
        include('prod'),
        group('Services', [
          include('prod.left', 'prod.right'),
          group('Apps', [include('prod.left.app', 'prod.right.app')]),
        ]),
      )
    ).toThrow('Cannot place deployment group "Apps": members "prod.left.app" and "prod.right.app" have different')
  })

  it('places nested groups within physical branches wrapped by an outer group', () => {
    const view = computeWithModel(
      nestedModel,
      include('prod'),
      group('Services', [
        include('prod.left', 'prod.right'),
        group('Left', [include('prod.left.app')]),
        group('Right', [include('prod.right.app')]),
      ]),
    )
    expect(parents(view)).toMatchObject({
      '@gr1': 'prod',
      'prod.left': '@gr1',
      'prod.right': '@gr1',
      '@gr2': 'prod.left',
      '@gr3': 'prod.right',
      'prod.left.app': '@gr2',
      'prod.right.app': '@gr3',
    })
  })

  it('rejects cross-parent selections in sibling groups', () => {
    expect(() =>
      computeWithModel(
        nestedModel,
        include('prod', 'prod.left', 'prod.right'),
        group('Apps', [include('prod.left.app', 'prod.right.app')]),
        group('APIs', [include('prod.left.api', 'prod.right.api')]),
      )
    ).toThrow('Cannot place deployment group "Apps": members "prod.left.app" and "prod.right.app" have different')
  })

  it('groups relationship endpoints within their implicitly added deployment boundary', () => {
    const view = compute(
      include('prod.app2'),
      group('Services', [{ include: [{ source: ref('prod.app1'), target: ref('prod.api') }] }]),
      { includeAncestors: true },
    )
    expect(parents(view)).toMatchObject({
      prod: null,
      '@gr1': 'prod',
      'prod.app1': '@gr1',
      'prod.api': '@gr1',
      'prod.app2': 'prod',
    })
    expect(view.edges.some(edge => edge.parent === '@gr1')).toBe(true)
  })

  it('rejects relationship endpoints with different deployment parents', () => {
    const endpointData: ParsedLikeC4ModelData = Builder
      .specification({ elements: { component: {} }, deployments: { node: {} } })
      .model(({ component }, _) => _(component('app')))
      .deployment(({ node, instanceOf, rel }, _) =>
        _(
          node('prod').with(node('left').with(instanceOf('app', 'app'))),
          node('other'),
          rel('prod.left', 'other'),
        )
      )
      .build()
    expect(() =>
      computeWithModel(
        LikeC4Model.fromParsed(endpointData),
        include('prod'),
        group('Child', [include('prod.left.app')]),
        group('Connection', [{ include: [{ source: ref('prod.left'), target: ref('other') }] }]),
      )
    ).toThrow('Cannot place deployment group "Connection": members "prod.left" and "other" have different')
  })

  it('evaluates filtered wildcard predicates inside nested groups', () => {
    const view = compute(group('Outer', [
      group('Inner', [{
        include: [{ where: { expr: { wildcard: true }, condition: { kind: { eq: 'component' } } } }],
      }]),
    ]))
    expect(parents(view)).toMatchObject({
      'prod.app1': '@gr2',
      'prod.app2': '@gr2',
      'prod.api': '@gr2',
    })
    expect(view.nodes.some(n => n.id === 'external')).toBe(false)
  })

  it('applies navigateTo inside groups without changing group styling', () => {
    const view = compute(
      group('Application', [{
        include: [{ custom: { expr: ref('prod.app1'), navigateTo: 'details' as ViewId } }],
      }], { color: 'amber' }),
      { targets: [{ wildcard: true }], style: { color: 'green' } },
    )
    expect(view.nodes.find(n => n.id === 'prod.app1')).toMatchObject({
      parent: '@gr1',
      color: 'green',
      navigateTo: 'details',
    })
    expect(view.nodes.find(n => n.id === '@gr1')?.color).toBe('amber')
  })
})
