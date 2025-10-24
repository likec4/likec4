import { afterEach, describe, expect, expectTypeOf, it } from 'vitest'
import {
  disableDynamicBranchCollections,
  enableDynamicBranchCollections,
} from '../../../config/featureFlags'
import type {
  DynamicBranchCollection,
  DynamicBranchPath,
  DynamicViewStep,
  LayoutedDynamicView,
  ParsedDynamicView,
  ViewId,
} from '../../../types'
import { _stage } from '../../../types'
import { fakeModel } from '../../element-view/__test__/fixture'
import { computeDynamicView } from '../compute'
import { $step } from './fixture'

const baseView = {
  [_stage]: 'parsed' as const,
  _type: 'dynamic' as const,
  id: 'branch-view' as ViewId,
  title: null,
  description: null,
  tags: null,
  links: null,
  rules: [],
}

function makeBranchPath(
  pathId: string,
  steps: DynamicViewStep<any>[],
  extras?: Partial<DynamicBranchPath<any>>,
): DynamicBranchPath<any> {
  return {
    pathId,
    astPath: `${pathId}/ast`,
    steps: steps as unknown as DynamicBranchPath<any>['steps'],
    ...extras,
  }
}

function makeBranch(): DynamicBranchCollection<any> {
  const firstStep = $step('customer -> cloud.frontend.dashboard', 'browse dashboard')
  const secondStep = $step('customer -> cloud.backend.graphql', 'call backend')
  return {
    branchId: '/branch@0',
    astPath: '/branch@0',
    kind: 'parallel',
    parallelId: '/branch@0',
    label: 'customer decisions',
    defaultPathId: '/branch@0/path@0',
    paths: [
      makeBranchPath('/branch@0/path@0', [firstStep], {
        pathName: 'happy',
        pathTitle: 'Happy path',
      }),
      makeBranchPath('/branch@0/path@1', [secondStep], {
        pathName: 'detour',
      }),
    ] as unknown as DynamicBranchCollection<any>['paths'],
  }
}

describe('DynamicViewCompute branch traversal', () => {
  afterEach(() => {
    disableDynamicBranchCollections()
  })

  it('emits hierarchical step ids and branch metadata when feature flag enabled', () => {
    enableDynamicBranchCollections()
    const branch = makeBranch()
    const view = {
      ...baseView,
      steps: [branch] as DynamicViewStep<any>[],
    } as ParsedDynamicView<any>
    const computed = computeDynamicView(fakeModel, view)

    expect(computed.edges.map(edge => edge.id)).toEqual([
      'step-01.01.01',
      'step-01.02.01',
    ])

    expect(computed.edges.map(edge => edge.branchTrail)).toMatchObject([
      [
        {
          branchId: branch.branchId,
          pathId: branch.paths[0]!.pathId,
          pathIndex: 1,
          indexWithinPath: 1,
          isDefaultPath: true,
        },
      ],
      [
        {
          branchId: branch.branchId,
          pathId: branch.paths[1]!.pathId,
          pathIndex: 2,
          indexWithinPath: 1,
          isDefaultPath: false,
        },
      ],
    ])

    expect(computed.branchCollections).toBeDefined()
    expect(computed.branchCollections).toHaveLength(1)
    const [collection] = computed.branchCollections!
    expect(collection).toMatchObject({
      branchId: branch.branchId,
      kind: 'parallel',
      defaultPathId: branch.defaultPathId,
      paths: [
        {
          pathId: branch.paths[0]!.pathId,
          pathIndex: 1,
          edgeIds: ['step-01.01.01'],
          isDefaultPath: true,
          pathTitle: 'Happy path',
        },
        {
          pathId: branch.paths[1]!.pathId,
          pathIndex: 2,
          edgeIds: ['step-01.02.01'],
          isDefaultPath: false,
        },
      ],
    })
  })

  it('keeps legacy numbering and omits metadata when feature flag disabled', () => {
    disableDynamicBranchCollections()
    const branch = makeBranch()
    const view = {
      ...baseView,
      steps: [branch] as DynamicViewStep<any>[],
    } as ParsedDynamicView<any>
    const computed = computeDynamicView(fakeModel, view)

    expect(computed.edges.map(edge => edge.id)).toEqual(['step-01', 'step-02'])
    expect(computed.edges.every(edge => !edge.branchTrail)).toBe(true)
    expect(computed).not.toHaveProperty('branchCollections')
  })

  it('sequence layout parallel areas expose branch metadata fields', () => {
    type Area = LayoutedDynamicView.Sequence.ParallelArea
    expectTypeOf<Area>().toHaveProperty('branchId').toEqualTypeOf<string | undefined>()
    expectTypeOf<Area>().toHaveProperty('pathId').toEqualTypeOf<string | undefined>()
    expectTypeOf<Area>().toHaveProperty('kind').toEqualTypeOf<'parallel' | 'alternate' | undefined>()
    expectTypeOf<Area>().toHaveProperty('isDefaultPath').toEqualTypeOf<boolean | undefined>()
  })
})
