import type { DiagramView } from '@likec4/core'
import JSON5 from 'json5'
import { CompositeGeneratorNode, NL, expandToNode, joinToNode, toString } from 'langium'

const componentName = (value: string): string => {
  if (!value.charAt(0).match(/[a-zA-Z]/)) {
    value = 'View' + value
  }
  value = value.replaceAll('_', '')
  return value.charAt(0).toLocaleUpperCase() + value.slice(1)
}

export const generateViewId = (views: DiagramView[]) =>
  joinToNode(views, view => expandToNode`'${view.id}'`, {
    separator: ' | '
  })

export function generateReact(views: DiagramView[]) {
  const components = views.map(({ id }) => {
    return {
      id,
      name: componentName(id)
    }
  })

  const out = new CompositeGeneratorNode()
  out.appendTemplate`
      /******************************************************************************
       * This file was generated
       * DO NOT EDIT MANUALLY!
       ******************************************************************************/
      /* eslint-disable */

      import type { DiagramView } from '@likec4/diagrams'
      import { LikeC4 } from '@likec4/diagrams'
    `.append(NL, NL)

  if (components.length == 0) {
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
              expandToNode`${JSON5.stringify(view.id)}: (${JSON5.stringify(
                view
              )} as unknown) as DiagramView`,
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

      export const {
        // guard
        isViewId,
        // React hook to use location hash for ViewId
        useViewId,
        // React component to display diagram
        Diagram,
        // React component to display diagram in responsive container
        Responsive,
        // React component to display diagram in fullscreen container
        Fullscreen,
        // React component to embed diagram and open browser on click
        Embedded,
        // React component to browse diagrams in fullscreen container
        Browser,
      } = LikeC4.create<LikeC4ViewId>(LikeC4Views)

      export type DiagramProps = LikeC4.DiagramProps<LikeC4ViewId>
      export type ResponsiveProps = LikeC4.ResponsiveProps<LikeC4ViewId>
      export type FullscreenProps = LikeC4.FullscreenProps<LikeC4ViewId>
      export type EmbeddedProps = LikeC4.EmbeddedProps<LikeC4ViewId>
      export type BrowserProps = LikeC4.BrowserProps<LikeC4ViewId>

      // Re-export types
      export type {
        DiagramApi,
        Fqn,
        Element,
        RelationID,
        Relation,
        NodeId,
        EdgeId,
        ViewID,
        ComputedView,
        LikeC4Theme,
        DiagramNode,
        DiagramEdge,
        DiagramLabel,
        DiagramView
      } from '@likec4/diagrams'
    `.append(NL)

  return toString(out)
}
