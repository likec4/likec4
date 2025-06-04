import { indexBy, isArray, isString, map, mapValues, pipe, prop } from 'remeda'
import type { Writable } from 'type-fest'
import type { ExpectStatic } from 'vitest'
import { expect as vitestExpect } from 'vitest'
import {
  type AnyTypes,
  type Builder,
  type ElementViewRulesBuilder,
  type Types,
  type ViewPredicate,
} from '../../../builder'
import * as viewhelpers from '../../../builder/Builder.view-common'
import { mkViewBuilder } from '../../../builder/Builder.views'
import type { ConnectionModel, ElementModel, LikeC4Model } from '../../../model'
import { differenceConnections } from '../../../model/connection'
import {
  type ComputedElementView,
  type ComputedView,
  type ParsedElementView as ElementView,
  type ViewId,
  type ViewRule,
  _stage,
  _type,
} from '../../../types'
import { compareNatural } from '../../../utils'
import { imap, toArray } from '../../../utils/iterable'
import { difference as differenceSet } from '../../../utils/set'
import { withReadableEdges } from '../../utils/with-readable-edges'
import { processPredicates as processPredicatesImpl } from '../compute'
import { Memory } from '../memory'

type ConnectionExpression<T extends AnyTypes> = `${T['Fqn']} -> ${T['Fqn']}`

// type ConnectionsDeepMatcher<T extends AnyTypes> = {
//   [K in `${T['Fqn']} -> ${T['Fqn']}`]?: {
//     relations?: Array<`${T['Fqn']} -> ${T['Fqn']}`>
//   }
// }

type ConnectionsDeepMatcher<Expr extends string> = {
  [K in Expr]?: Array<Expr>
}

type ConnectionEqual<T extends AnyTypes> = [ConnectionsDeepMatcher<ConnectionExpression<T>>] | [
  ConnectionExpression<T>,
  ...ConnectionExpression<T>[],
]

export class TestHelper<T extends AnyTypes> {
  Aux!: Types.ToAux<T>
  Elem!: ElementModel<typeof this.Aux>
  Connection!: ConnectionModel<typeof this.Aux>
  CompView!: ComputedElementView<typeof this.Aux>

  model: LikeC4Model.Computed<typeof this.Aux>

  static $include = viewhelpers.$include
  static $exclude = viewhelpers.$exclude
  static $rules = viewhelpers.$rules
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
    this.model = builder.toLikeC4Model()
  }

  computeView = (...rules: ElementViewRulesBuilder<T>[]) => {
    return withReadableEdges(
      this.builder
        .clone()
        .views(_ => _.view('dev').with(...rules))
        .toLikeC4Model()
        .view('dev')
        .$view,
      ' -> ',
    )
  }

  processPredicates(...rules: ElementViewRulesBuilder<T>[]) {
    return ProcessPredicates.execute(this, ...rules)
  }
  processPredicatesWithScope(scope: T['Fqn'], ...rules: ElementViewRulesBuilder<T>[]) {
    return ProcessPredicates.executeWithScope(this, scope, ...rules)
  }

  expectView(view: ComputedView) {
    return {
      toHave: (nodesAndEdges: { nodes: Array<T['Fqn']>; edges: Array<ConnectionExpression<T>> }) => {
        const actual = {
          nodes: view.nodes.map(prop('id')),
          edges: view.edges.map(prop('id')),
        }
        this._expect(actual).toEqual(nodesAndEdges)
      },
      toHaveNodes: <Id extends T['Fqn']>(...nodes: Id[]) => {
        this._expect(view.nodes.map(prop('id'))).toEqual(nodes)
      },
      toHaveEdges: <Id extends ConnectionExpression<T>>(...edges: Id[]) => {
        this._expect(view.edges.map(prop('id'))).toEqual(edges)
      },
    }
  }

  expectComputedView(...rules: ElementViewRulesBuilder<T>[]) {
    return this.expectView(this.computeView(...rules))
  }

  expectMemory = (memory: Memory) => ({
    toHaveAllElements: <Id extends T['Fqn']>(...ids: Id[]) => {
      this._expect(map([...memory.elements], prop('id'))).toEqual(ids)
    },
    /**
     * Final elements (visible in the view)
     */
    toHaveElements: <Id extends T['Fqn']>(...ids: Id[]) => {
      this._expect(map([...memory.final], prop('id'))).toEqual(ids)
    },
    toHaveConnections: (...matchers: ConnectionEqual<T>) => {
      this.expectConnections(memory.connections as any).toEqual(...matchers)
    },
  })

  expectElements = (elements: ReadonlySet<typeof this.Elem>) => ({
    toEqual: <const Id extends ViewPredicate.DeploymentConnectionExpression<T>>(...ids: Id[]) => {
      this._expect(toArray(imap(elements, prop('id')))).toEqual(ids)
    },
  })

  expectConnections = (connections: ReadonlyArray<typeof this.Connection>) => ({
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
        mapValues(c => [...c.relations].map(prop('expression')).sort(compareNatural)),
      )
      const expected = mapValues(matcher, (v: any) => [...v].sort(compareNatural))
      this._expect(obj).toEqual(expected)
    },
  })

  expectStep = (step: ProcessPredicates<T>) => ({
    ...this.expectMemory(step.memory),
  })

  expect(value: typeof this.CompView): ReturnType<typeof this['expectView']>
  expect(value: Set<typeof this.Elem>): ReturnType<typeof this['expectElements']>
  expect(value: ReadonlyArray<typeof this.Connection>): ReturnType<typeof this['expectConnections']>
  expect(value: Memory | ProcessPredicates<T>): ReturnType<typeof this['expectMemory']>
  expect(
    value:
      | Memory
      | ProcessPredicates<T>
      | Set<typeof this.Elem>
      | typeof this.CompView
      | ReadonlyArray<typeof this.Connection>,
  ) {
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
  static execute<B extends AnyTypes>(
    test: TestHelper<B>,
    ...rules: ElementViewRulesBuilder<B>[]
  ) {
    const processor = new ProcessPredicates<B>(test)
    processor.next(...rules)
    return processor
  }

  static executeWithScope<A extends AnyTypes>(
    test: TestHelper<A>,
    scope: A['Fqn'],
    ...rules: ElementViewRulesBuilder<A>[]
  ) {
    const processor = new ProcessPredicates<A>(test, scope)
    processor.next(...rules)
    return processor
  }

  public viewrules: ReadonlyArray<ViewRule<typeof this.t.model.Aux>> = []

  public previousMemory: Memory = Memory.empty(null)
  public memory: Memory = Memory.empty(null)
  public predicates: ElementViewRulesBuilder<T>[] = []

  constructor(
    public readonly t: TestHelper<T>,
    public scope: T['Fqn'] | null = null,
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

  next(...predicates: ElementViewRulesBuilder<T>[]): this {
    const view = {
      id: 'test' as ViewId,
      [_stage]: 'parsed',
      [_type]: 'element',
      rules: [],
      title: null,
      description: null,
    } as Writable<ElementView<typeof this.t.model.Aux>>
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
    const scope = this.scope ? this.t.model.element(this.scope) : null
    this.memory = processPredicatesImpl(
      this.t.model,
      Memory.empty(scope as any),
      view.rules,
    )
    this.age++
    return this
  }
}
