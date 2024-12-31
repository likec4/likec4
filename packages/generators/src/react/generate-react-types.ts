import type { LikeC4Model } from '@likec4/core'
import { compareNatural, sortNaturalByFqn } from '@likec4/core'

function toUnion(unionset: string[] | Set<string>) {
  if (unionset instanceof Set) {
    unionset = [...unionset].sort(compareNatural)
  }
  const union = unionset.map(v => `  | ${JSON.stringify(v)}`)
  if (union.length === 0) {
    union.push('  never')
  }
  return union.join('\n') + ';'
}

export function generateReactTypes(model: LikeC4Model.Layouted) {
  const {
    fqns,
    tags,
    kinds,
  } = sortNaturalByFqn([...model.elements()]).reduce((acc, d) => {
    acc.fqns.push(d.id)
    acc.kinds.add(d.kind)
    acc.tags.push(...d.tags)
    return acc
  }, {
    fqns: [] as string[],
    kinds: new Set<string>(),
    tags: [] as string[],
  })
  const deploymentFqns = sortNaturalByFqn([...model.deployment.elements()]).map((e) => e.id)

  const {
    viewIds,
  } = [...model.views()].reduce((acc, d) => {
    acc.viewIds.add(d.id)
    acc.tags.push(...d.tags)
    acc.tags.push(...d.includedTags)
    return acc
  }, {
    viewIds: new Set<string>(),
    tags,
  })

  return `
/* prettier-ignore-start */
/* eslint-disable */

/******************************************************************************
 * This file was generated
 * DO NOT EDIT MANUALLY!
 ******************************************************************************/

import type { PropsWithChildren } from 'react'
import type { JSX } from 'react/jsx-runtime'
import type {
  LikeC4Model as GenericLikeC4Model,
} from 'likec4/model'
import type {
  LikeC4ViewProps as GenericLikeC4ViewProps,
  ViewData,
  ReactLikeC4Props as GenericReactLikeC4Props
} from 'likec4/react'

type LikeC4ElementId =
${toUnion(fqns)}

type LikeC4DeploymentId =
${toUnion(deploymentFqns)}

type LikeC4ViewId =
${toUnion(viewIds)}

type LikeC4ElementKind =
${toUnion(kinds)}

type LikeC4Tag =
${toUnion(new Set(tags))}

type LikeC4ViewData = ViewData<LikeC4ViewId, LikeC4Tag>

declare const LikeC4Views: {
  readonly [K in LikeC4ViewId]: LikeC4ViewData
};
declare function isLikeC4ViewId(value: unknown): value is LikeC4ViewId;

type Aux = GenericLikeC4Model.Typed<LikeC4ElementId, LikeC4DeploymentId, LikeC4ViewId, LikeC4ViewData>;
type LikeC4Model = GenericLikeC4Model<Aux>;
type LikeC4ViewModel = GenericLikeC4Model.View<Aux>;

declare const likeC4Model: LikeC4Model;
declare function useLikeC4Model(): LikeC4Model;
declare function useLikeC4View(viewId: LikeC4ViewId): LikeC4ViewData;
declare function useLikeC4ViewModel(viewId: LikeC4ViewId): LikeC4ViewModel;

declare function LikeC4ModelProvider(props: PropsWithChildren): JSX.Element;

type IconRendererProps = {
  node: {
    id: string
    title: string
    icon?: string | undefined
  }
}
declare function RenderIcon(props: IconRendererProps): JSX.Element;

type LikeC4ViewProps = GenericLikeC4ViewProps<LikeC4ViewId, LikeC4Tag, LikeC4ElementKind>;
declare function LikeC4View({viewId, ...props}: LikeC4ViewProps): JSX.Element;

type ReactLikeC4Props =
  & Omit<GenericReactLikeC4Props<LikeC4ViewId, LikeC4Tag, LikeC4ElementKind>, 'view' | 'renderIcon'>
  & {
    viewId: LikeC4ViewId
  };
declare function ReactLikeC4({viewId, ...props}: ReactLikeC4Props): JSX.Element;

export {
  type LikeC4ElementId,
  type LikeC4DeploymentId,
  type LikeC4ViewId,
  type LikeC4Tag,
  type LikeC4ElementKind,
  type LikeC4ViewData,
  type LikeC4ViewProps,
  type ReactLikeC4Props,
  type LikeC4Model,
  isLikeC4ViewId,
  useLikeC4Model,
  useLikeC4View,
  useLikeC4ViewModel,
  likeC4Model,
  LikeC4Views,
  LikeC4ModelProvider,
  LikeC4View,
  RenderIcon,
  ReactLikeC4
}
/* prettier-ignore-end */
`.trimStart()
}
