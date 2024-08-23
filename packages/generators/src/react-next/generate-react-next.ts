import type { DiagramView } from '@likec4/core'
import { CompositeGeneratorNode, toString } from 'langium/generate'
import { generateViewsDataDTs, generateViewsDataJs } from '../views-data-ts/generate-views-data'

/**
 * @deprecated in favor packages/likec4/src/cli/codegen/react/index.ts
 */
export function generateReactNext(views: Iterable<DiagramView>) {
  return {
    viewsData: {
      fileName: 'likec4-views-data',
      js: generateViewsDataJs(views),
      dts: generateViewsDataDTs(views)
    },
    components: {
      fileName: 'likec4-components',
      ...generateComponents()
    },
    index: generateIndex()
  }
}

function generateComponents() {
  const js = new CompositeGeneratorNode().appendTemplate`
    /******************************************************************************
     * This file was generated
     * DO NOT EDIT MANUALLY!
     ******************************************************************************/
    /* prettier-ignore-start */
    /* eslint-disable */
    import { createElement } from "react";
    import { LikeC4Diagram, EmbeddedLikeC4Diagram } from "@likec4/diagram";
    import { LikeC4Views } from "./likec4-views-data";
    export function LikeC4View({ viewId, ...props }) {
        const view = LikeC4Views[viewId];
        if (!view) {
            throw new Error(\`LikeC4View NotFound: "\${viewId}"\`);
        }
        return createElement(LikeC4Diagram, { view: view, ...props });
    }
    export function EmbeddedLikeC4View({ viewId, ...props }) {
        return createElement(EmbeddedLikeC4Diagram, { viewId: viewId, views: LikeC4Views, ...props });
    }
    /* prettier-ignore-end */
  `

  const dts = new CompositeGeneratorNode().appendTemplate`
    /// <reference types="react" />
    /******************************************************************************
     * This file was generated
     * DO NOT EDIT MANUALLY!
     ******************************************************************************/
    /* prettier-ignore-start */
    /* eslint-disable */

    import type { LikeC4DiagramProps, EmbeddedLikeC4DiagramProps } from "@likec4/diagram";
    import type { LikeC4ViewId } from "./likec4-views-data";

    export type LikeC4ViewProps = {
        viewId: LikeC4ViewId;
    } & Omit<LikeC4DiagramProps, "view">;

    export declare function LikeC4View({ viewId, ...props }: LikeC4ViewProps): JSX.Element;

    export type EmbeddedLikeC4ViewProps = {
        viewId: LikeC4ViewId;
    } & Omit<EmbeddedLikeC4DiagramProps, "viewId" | "views">;

    export declare function EmbeddedLikeC4View({ viewId, ...props }: EmbeddedLikeC4ViewProps): JSX.Element;
    /* prettier-ignore-end */
  `
  return {
    js: toString(js),
    dts: toString(dts)
  }
}

function generateIndex() {
  const js = new CompositeGeneratorNode().appendTemplate`
    /* prettier-ignore-start */
    /* eslint-disable */

    // You are safe to edit/move these style imports,
    // but they are required
    import "@mantine/core/styles.css";
    import "@likec4/diagram/style.css";

    export * from "./likec4-components";

    // OR with lazy loading:
    //
    // import { lazy } from "react";
    // export const LikeC4View = lazy(async () => await import("./likec4-components").then(m => ({default: m.LikeC4View})));
    // export const EmbeddedLikeC4View = lazy(async () => await import("./likec4-components").then(m => ({default: m.EmbeddedLikeC4View})));

    /* prettier-ignore-end */
  `

  const dts = new CompositeGeneratorNode().appendTemplate`
    /* prettier-ignore-start */
    /* eslint-disable */

    export * from "./likec4-components";

    /* prettier-ignore-end */
  `
  return {
    js: toString(js),
    dts: toString(dts)
  }
}
