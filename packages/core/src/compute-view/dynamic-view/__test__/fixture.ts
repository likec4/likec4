import { partition } from 'remeda'
import type { DynamicViewRule, DynamicViewStep, Fqn, ViewId, ViewRulePredicate } from '../../../types'
import { type FakeElementIds, fakeModel } from '../../element-view/__test__/fixture'
import { DynamicViewComputeCtx } from '../compute'

const emptyView = {
  __: 'dynamic' as const,
  id: 'index' as ViewId,
  title: null,
  description: null,
  tags: null,
  links: null,
  customColorDefinitions: {},
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
  const view = DynamicViewComputeCtx.compute(
    {
      ...emptyView,
      steps,
      rules: rules as DynamicViewRule[]
    },
    fakeModel
  )
  return Object.assign(view, {
    nodeIds: view.nodes.map((node) => node.id) as string[],
    edgeIds: view.edges.map((edge) => edge.id) as string[]
  })
}
