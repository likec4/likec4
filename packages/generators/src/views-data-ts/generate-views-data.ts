import type { DiagramView } from '@likec4/core'
import JSON5 from 'json5'
import { CompositeGeneratorNode, expandToNode, joinToNode, NL, toString } from 'langium/generate'
import { generateViewId } from '../react/generate-react'

export function generateViewsDataJs(views: DiagramView[]) {
  const out = new CompositeGeneratorNode()
  out.appendTemplate`
    /******************************************************************************
     * This file was generated
     * DO NOT EDIT MANUALLY!
     ******************************************************************************/
    /* prettier-ignore-start */
    /* eslint-disable */

    `.append(NL, NL)

  if (views.length == 0) {
    out.append('export const LikeC4Views = {}', NL)
    return toString(out)
  }

  out.appendTemplate`
    export const LikeC4Views = {
  `
    .indent({
      indentation: 2,
      indentedChildren(indented) {
        indented.appendNewLineIf(views.length > 1).append(
          joinToNode(
            views,
            view => expandToNode`${JSON5.stringify(view.id)}: ${JSON5.stringify(view)}`,
            {
              separator: ',',
              appendNewLineIfNotEmpty: true
            }
          )
        )
      }
    })
    .append('}', NL, NL).appendTemplate`

    export function isLikeC4ViewId(value) {
      return (
        value != null &&
        typeof value === 'string' &&
        Object.hasOwn(LikeC4Views, value) &&
        LikeC4Views[value] != null
      )
    }

    /* prettier-ignore-end */
  `.append(NL)
  return toString(out)
}

export function generateViewsDataTs(views: DiagramView[]) {
  const out = new CompositeGeneratorNode()
  out.appendTemplate`
    /******************************************************************************
     * This file was generated
     * DO NOT EDIT MANUALLY!
     ******************************************************************************/
    /* prettier-ignore-start */
    /* eslint-disable */

    // @ts-nocheck

    import type { DiagramView } from '@likec4/core'
    `.append(NL, NL)

  if (views.length == 0) {
    out.append('export {}', NL)
    return toString(out)
  }

  out.appendTemplate`
    export type LikeC4ViewId = ${generateViewId(views)};
    export const LikeC4Views = {
  `
    .indent({
      indentation: 2,
      indentedChildren(indented) {
        indented.appendNewLineIf(views.length > 1).append(
          joinToNode(
            views,
            view =>
              expandToNode`${JSON5.stringify(view.id)}: (${
                JSON5.stringify(
                  view
                )
              } as unknown) as DiagramView`,
            {
              separator: ',',
              appendNewLineIfNotEmpty: true
            }
          )
        )
      }
    })
    .append('} as const satisfies Record<LikeC4ViewId, DiagramView>', NL, NL).appendTemplate`
    export type LikeC4Views = typeof LikeC4Views

    export function isLikeC4ViewId(value: unknown): value is LikeC4ViewId {
      return (
        value != null &&
        typeof value === 'string' &&
        Object.hasOwn(LikeC4Views, value) &&
        LikeC4Views[value] != null
      )
    }

    /* prettier-ignore-end */
  `.append(NL)
  return toString(out)
}

export function generateViewsDataDTs(views: DiagramView[]) {
  const out = new CompositeGeneratorNode()
  out.appendTemplate`
    /******************************************************************************
     * This file was generated
     * DO NOT EDIT MANUALLY!
     ******************************************************************************/
    /* prettier-ignore-start */
    /* eslint-disable */

    import type { DiagramView } from '@likec4/core'
    `.append(NL, NL)

  if (views.length == 0) {
    out.append('export {}', NL)
    return toString(out)
  }

  out.appendTemplate`
    export type LikeC4ViewId = ${generateViewId(views)};
    export type LikeC4Views = Record<LikeC4ViewId, DiagramView>

    export declare const LikeC4Views: LikeC4Views
    export declare function isLikeC4ViewId(value: unknown): value is LikeC4ViewId

    /* prettier-ignore-end */
  `.append(NL)
  return toString(out)
}
