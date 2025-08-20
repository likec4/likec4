import type { AnyLikeC4Model } from '@likec4/core/model'
import { invariant } from '@likec4/core/utils'
import { generateAux } from '../model/generate-aux'

export function generateReactTypes(model: AnyLikeC4Model) {
  invariant(!model.isParsed(), 'can not generate react types for parsed model')
  const aux = generateAux(model)

  return `
/* prettier-ignore-start */
/* eslint-disable */

/******************************************************************************
 * This file was generated
 * DO NOT EDIT MANUALLY!
 ******************************************************************************/

import type { PropsWithChildren } from 'react'
import type { JSX } from 'react/jsx-runtime'
import type { LikeC4Model } from '@likec4/core/model'
import type { DiagramView } from '@likec4/core/types'
import type {
  LikeC4ViewProps as GenericLikeC4ViewProps,
  ReactLikeC4Props as GenericReactLikeC4Props
} from 'likec4/react'

${aux}

declare function isLikeC4ViewId(value: unknown): value is $ViewId;

declare const likec4model: LikeC4Model<$Aux>;
declare function useLikeC4Model(): LikeC4Model<$Aux>;
declare function useLikeC4View(viewId: $ViewId): DiagramView<$Aux>;

declare function LikeC4ModelProvider(props: PropsWithChildren): JSX.Element;

type IconRendererProps = {
  node: {
    id: string
    title: string
    icon?: string | undefined
  }
}
declare function RenderIcon(props: IconRendererProps): JSX.Element;

type LikeC4ViewProps = GenericLikeC4ViewProps<$Aux>;
declare function LikeC4View({viewId, ...props}: LikeC4ViewProps): JSX.Element;

type ReactLikeC4Props = GenericReactLikeC4Props<$Aux>
declare function ReactLikeC4({viewId, ...props}: ReactLikeC4Props): JSX.Element;

export {
  type LikeC4ViewProps,
  type ReactLikeC4Props,
  isLikeC4ViewId,
  useLikeC4Model,
  useLikeC4View,
  likec4model,
  LikeC4ModelProvider,
  LikeC4View,
  RenderIcon,
  ReactLikeC4
}
/* prettier-ignore-end */
`.trimStart()
}
