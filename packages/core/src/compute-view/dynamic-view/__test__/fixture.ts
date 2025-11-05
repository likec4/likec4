import { partition } from 'remeda'
import type {
  DynamicStep,
  DynamicViewIncludeRule,
  DynamicViewRule,
  DynamicViewStep,
  ElementViewPredicate,
  Fqn,
  ParsedDynamicView as DynamicView,
  ViewId,
} from '../../../types'
import { type $Aux, type FakeElementIds, fakeModel } from '../../element-view/__test__/fixture'
import { computeDynamicView } from '../compute'

const emptyView = {
  _type: 'dynamic' as const,
  id: 'index' as ViewId,
  title: null,
  description: null,
  tags: null,
  links: null,
  rules: [],
}

type StepExpr = `${FakeElementIds} ${'->' | '<-'} ${FakeElementIds}`
type StepProps = Omit<DynamicStep, 'source' | 'target' | 'isBackward'>

export function $step(expr: StepExpr, props?: string | Partial<StepProps>): DynamicStep {
  const title = typeof props === 'string' ? props : props?.title
  if (expr.includes(' -> ')) {
    const [source, target] = expr.split(' -> ')
    return {
      source: source as Fqn,
      target: target as Fqn,
      astPath: '',
      ...(typeof props === 'object' ? props : {}),
      title: title ?? null,
    }
  }
  if (expr.includes(' <- ')) {
    const [target, source] = expr.split(' <- ')
    return {
      source: source as Fqn,
      target: target as Fqn,
      astPath: '',
      ...(typeof props === 'object' ? props : {}),
      title: title ?? null,
      isBackward: true,
    }
  }
  throw new Error(`Invalid step expression: ${expr}`)
}

export function compute(
  stepsAndRules: (DynamicViewStep<$Aux> | ElementViewPredicate<$Aux> | DynamicViewIncludeRule<$Aux>)[],
) {
  const [steps, rules] = partition(
    stepsAndRules,
    (s): s is DynamicViewStep<$Aux> => 'source' in s || 'paths' in s || '__series' in s || '__parallel' in s,
  )
  let view = computeDynamicView(
    fakeModel,
    {
      ...emptyView,
      steps,
      rules: rules as DynamicViewRule[],
    } as DynamicView,
  )
  return Object.assign(view, {
    nodeIds: view.nodes.map((node) => node.id) as string[],
    edgeIds: view.edges.map((edge) => edge.id) as string[],
  })
}
