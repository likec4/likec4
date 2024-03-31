import type { DiagramView } from '@likec4/core'
import { generateViewsDataDTs, generateViewsDataJs } from '@likec4/generators'
import { CompositeGeneratorNode, toString } from 'langium/generate'

export function generateSources(views: Iterable<DiagramView>) {
  return {
    views: {
      js: generateViewsDataJs(views),
      dts: generateViewsDataDTs(views)
    },
    index: generateIndex()
  }
}

function generateIndex() {
  const js = new CompositeGeneratorNode().appendTemplate`
    /******************************************************************************
     * This file was generated
     * DO NOT EDIT MANUALLY!
     ******************************************************************************/
    /* prettier-ignore-start */
    /* eslint-disable */
    import "@likec4/diagram/style.css";

    import { createElement } from "react";
    import { LikeC4Diagram, EmbeddedLikeC4Diagram } from "@likec4/diagram";
    import { LikeC4Views } from "./views";
    export function LikeC4View({ viewId, ...props }) {
        const view = LikeC4Views[viewId];
        if (!view) {
            throw new Error("Not found view: " + viewId);
        }
        return createElement(LikeC4Diagram, { view: view, ...props });
    }
    export function EmbeddedLikeC4View({ viewId, ...props }) {
        return createElement(EmbeddedLikeC4Diagram, { viewId: viewId, views: LikeC4Views, ...props });
    }
    export { isLikeC4ViewId, LikeC4Views } from "./views";
    /* prettier-ignore-end */
  `

  const dts = new CompositeGeneratorNode().appendTemplate`
    /// <reference types="react" />
    import type { LikeC4DiagramProps, EmbeddedLikeC4DiagramProps } from "@likec4/diagram";
    import type { LikeC4ViewId } from "./views";

    export type LikeC4ViewProps = {
        viewId: LikeC4ViewId;
    } & Omit<LikeC4DiagramProps, "view">;

    export declare function LikeC4View({ viewId, ...props }: LikeC4ViewProps): JSX.Element;

    export type EmbeddedLikeC4ViewProps = {
        viewId: LikeC4ViewId;
    } & Omit<EmbeddedLikeC4DiagramProps, "viewId" | "views">;

    export declare function EmbeddedLikeC4View({ viewId, ...props }: EmbeddedLikeC4ViewProps): JSX.Element;

    export * from "./views";
  `
  return {
    js: toString(js),
    dts: toString(dts)
  }
}
