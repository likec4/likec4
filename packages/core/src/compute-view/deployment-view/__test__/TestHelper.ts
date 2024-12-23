import { indexBy, isArray, isString, map, mapValues, pipe, prop } from 'remeda'
import type { Writable } from 'type-fest'
import type { ExpectStatic } from 'vitest'
import { expect as vitestExpect } from 'vitest'
import {
  type AnyTypes,
  type Builder,
  type DeploymentRulesBuilderOp,
  type Types,
  type ViewPredicate,
} from '../../../builder'
import * as viewhelpers from '../../../builder/Builder.view-common'
import { mkViewBuilder } from '../../../builder/Builder.views'
import { differenceConnections } from '../../../model/connection'
import type { ComputedDeploymentView, DeploymentView, DeploymentViewRule, ViewId } from '../../../types'
import { imap, toArray } from '../../../utils/iterable'
import { difference as differenceSet } from '../../../utils/set'
import { withReadableEdges } from '../../utils/with-readable-edges'
import { processPredicates as processPredicatesImpl } from '../compute'
import { Memory } from '../memory'

type ConnectionExpression<T extends AnyTypes> = `${T['DeploymentFqn']} -> ${T['DeploymentFqn']}`

type ConnectionsDeepMatcher<M extends string, D extends string> = {
  [K in `${D} -> ${D}`]?: {
    model?: Array<`${M} -> ${M}`>
    deployment?: Array<`${D} -> ${D}`>
  }
}

type ToDeepMatcher<T extends AnyTypes> = ConnectionsDeepMatcher<T['Fqn'], T['DeploymentFqn']>

type ConnectionEqual<T extends AnyTypes> = [ToDeepMatcher<T>] | [ConnectionExpression<T>, ...ConnectionExpression<T>[]]

type Elem = Memory['Ctx']['Element']
type Connection = Memory['Ctx']['Connection']

export class TestHelper<T extends AnyTypes> {
  model: Types.ToLikeC4Model<T>

  static $include = viewhelpers.$include
  static $exclude = viewhelpers.$exclude
  static $style = viewhelpers.$style

  $include = viewhelpers.$include
  $exclude = viewhelpers.$exclude
  $style = viewhelpers.$style

  static from<const T extends AnyTypes>(builder: Builder<T>, expect = vitestExpect): TestHelper<T> {
    return new TestHelper(builder, expect)
  }

  constructor(
    private builder: Builder<T>,
    private _expect: ExpectStatic,
  ) {
    this.model = builder.toLikeC4Model() as Types.ToLikeC4Model<T>
  }

  computeView = (...rules: DeploymentRulesBuilderOp<T>[]) => {
    return withReadableEdges(
      this.builder
        .clone()
        .views(_ => _.deploymentView('dev').with(...rules))
        .toLikeC4Model()
        .view('dev')
        .$view as ComputedDeploymentView<'dev'>,
      ' -> ',
    )
  }

  processPredicates(...rules: DeploymentRulesBuilderOp<T>[]) {
    return ProcessPredicates.execute(this, ...rules)
  }

  expectView(view: ComputedDeploymentView) {
    return {
      toHave: (nodesAndEdges: { nodes: Array<T['DeploymentFqn']>; edges: Array<ConnectionExpression<T>> }) => {
        const actual = {
          nodes: view.nodes.map(prop('id')),
          edges: view.edges.map(prop('id')),
        }
        this._expect(actual).toEqual(nodesAndEdges)
      },
      toHaveNodes: <Id extends T['DeploymentFqn']>(...nodes: Id[]) => {
        this._expect(view.nodes.map(prop('id'))).toEqual(nodes)
      },
      toHaveEdges: <Id extends ConnectionExpression<T>>(...edges: Id[]) => {
        this._expect(view.edges.map(prop('id'))).toEqual(edges)
      },
    }
  }

  expectComputedView(...rules: DeploymentRulesBuilderOp<T>[]) {
    return this.expectView(this.computeView(...rules))
  }

  expectMemory = (memory: Memory) => ({
    toHaveAllElements: <Id extends T['DeploymentFqn']>(...ids: Id[]) => {
      this._expect(map([...memory.elements], prop('id'))).toEqual(ids)
    },
    toHaveElements: <Id extends T['DeploymentFqn']>(...ids: Id[]) => {
      this._expect(map([...memory.final], prop('id'))).toEqual(ids)
    },
    toHaveConnections: (...matchers: ConnectionEqual<T>) => {
      this.expectConnections(memory.connections).toEqual(...matchers)
    },
  })

  expectElements = (elements: ReadonlySet<Elem>) => ({
    toEqual: <const Id extends ViewPredicate.DeploymentConnectionExpression<T>>(...ids: Id[]) => {
      this._expect(toArray(imap(elements, prop('id')))).toEqual(ids)
    },
  })

  expectConnections = (connections: ReadonlyArray<Connection>) => ({
    toBeEmpty: () => {
      this._expect(connections.map(c => c.expression)).to.be.empty
    },
    toEqual: (...matchers: ConnectionEqual<T>) => {
      const [matcher, ...rest] = matchers
      if (isString(matcher)) {
        this._expect(connections.map(c => c.expression)).toEqual([matcher, ...rest])
        return
      }
      const obj = pipe(
        connections,
        indexBy(prop('expression')),
        mapValues(c => ({
          model: toArray(imap(c.relations.model, prop('expression'))).sort(),
          deployment: toArray(imap(c.relations.deployment, prop('expression'))).sort(),
        })),
      )
      const expected = mapValues(matcher, (v: any) => ({
        ...v,
        model: v.model ? [...v.model].sort() : [],
        deployment: v.deployment ? [...v.deployment].sort() : [],
      }))
      this._expect(obj).toEqual(expected)
    },
  })

  expectStep = (step: ProcessPredicates<T>) => ({
    ...this.expectMemory(step.memory),
  })

  expect(value: ComputedDeploymentView): ReturnType<typeof this['expectView']>
  expect(value: Set<Elem>): ReturnType<typeof this['expectElements']>
  expect(value: ReadonlyArray<Connection>): ReturnType<typeof this['expectConnections']>
  expect(value: Memory | ProcessPredicates<T>): ReturnType<typeof this['expectMemory']>
  expect(value: Memory | ProcessPredicates<T> | Set<Elem> | ComputedDeploymentView | ReadonlyArray<Connection>) {
    if (value instanceof Memory) {
      return this.expectMemory(value)
    }
    if (value instanceof ProcessPredicates) {
      return this.expectStep(value)
    }
    if (value instanceof Set) {
      return this.expectElements(value)
    }
    if (isArray(value)) {
      return this.expectConnections(value)
    }
    return this.expectView(value)
  }
}

class ProcessPredicates<T extends AnyTypes> {
  static execute<A extends AnyTypes>(
    test: TestHelper<A>,
    ...rules: DeploymentRulesBuilderOp<A>[]
  ): ProcessPredicates<A> {
    const processor = new ProcessPredicates(test)
    processor.next(...rules)
    return processor
  }

  public viewrules: ReadonlyArray<DeploymentViewRule> = []

  public previousMemory: Memory = Memory.empty()
  public memory: Memory = Memory.empty()
  public predicates: DeploymentRulesBuilderOp<T>[] = []

  constructor(
    public readonly t: TestHelper<T>,
    protected age = 0,
  ) {}

  get elements() {
    return toArray(imap(this.memory.elements, prop('id')))
  }

  get connections() {
    return this.memory.connections.map(c => c.expression)
  }

  diff() {
    const prevState = this.previousMemory
    const state = this.memory
    return {
      added: this.memory.update({
        elements: differenceSet(state.elements, prevState.elements),
        explicits: differenceSet(state.explicits, prevState.explicits),
        final: differenceSet(state.final, prevState.final),
        connections: differenceConnections(state.connections, prevState.connections),
      }),
      removed: this.memory.update({
        elements: differenceSet(prevState.elements, state.elements),
        explicits: differenceSet(prevState.explicits, state.explicits),
        final: differenceSet(prevState.final, state.final),
        connections: differenceConnections(prevState.connections, state.connections),
      }),
    }
  }

  next(...predicates: DeploymentRulesBuilderOp<T>[]): this {
    const view = {
      id: 'test' as ViewId,
      __: 'deployment',
      rules: [],
    } as any as Writable<DeploymentView>
    let vb = mkViewBuilder(view) as any
    this.predicates = [
      ...this.predicates,
      ...predicates,
    ]
    for (const rule of this.predicates) {
      rule(vb)
    }
    this.previousMemory = this.memory
    this.viewrules = view.rules
    this.memory = processPredicatesImpl(this.t.model.deployment, view.rules)
    this.age++
    return this
  }
}
