import type { DynamicViewRule, DynamicViewStep, Fqn, ViewID, ViewRulePredicate } from '@likec4/core'
import { partition } from 'remeda'
import { type FakeElementIds, fakeModel } from '../../compute-view/__test__/fixture'
import { computeDynamicView } from '../index'

const emptyView = {
  __: 'dynamic' as const,
  id: 'index' as ViewID,
  title: null,
  description: null,
  tags: null,
  links: null,
  rules: []
}

type StepExpr = `${FakeElementIds} ${'->' | '<-'} ${FakeElementIds}`
type StepProps = Omit<DynamicViewStep, 'source' | 'target' | 'isBackward'>

export function $step(expr: StepExpr, props?: string | Partial<StepProps>): DynamicViewStep {
  const title = typeof props === 'string' ? props : props?.title
  if (expr.includes(' -> ')) {
    const [source, target] = expr.split(' -> ')
    return {
      source: source as Fqn,
      target: target as Fqn,
      ...(typeof props === 'object' ? props : {}),
      title: title ?? null
    }
  }
  if (expr.includes(' <- ')) {
    const [target, source] = expr.split(' <- ')
    return {
      source: source as Fqn,
      target: target as Fqn,
      ...(typeof props === 'object' ? props : {}),
      title: title ?? null,
      isBackward: true
    }
  }
  throw new Error(`Invalid step expression: ${expr}`)
}

export function compute(stepsAndRules: (DynamicViewStep | ViewRulePredicate)[]) {
  const [steps, rules] = partition(stepsAndRules, (s): s is DynamicViewStep => 'source' in s)
  const result = computeDynamicView(
    {
      ...emptyView,
      steps,
      rules: rules as DynamicViewRule[]
    },
    fakeModel
  )
  if (!result.isSuccess) {
    throw result.error
  }
  return Object.assign(result.view, {
    nodeIds: result.view.nodes.map((node) => node.id) as string[],
    edgeIds: result.view.edges.map((edge) => edge.id) as string[]
  })
}
