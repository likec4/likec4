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
    import { jsx, Fragment, jsxs } from "react/jsx-runtime";
    import { LikeC4Diagram, EmbeddedLikeC4Diagram } from "@likec4/diagram";
    import { useInjectStyles } from "@likec4/diagram/bundle";
    import { LikeC4Views } from "./views";
    function InjectStyles() {
        useInjectStyles();
        return null;
    }
    export function LikeC4View({ viewId, injectStyles = true, ...props }) {
        const view = LikeC4Views[viewId];
        if (!view) {
            throw new Error("Not found view: " + viewId);
        }
        return jsxs(Fragment, { children: [injectStyles === true && jsx(InjectStyles, {}), jsx(LikeC4Diagram, { view: view, ...props })] });
    }
    export function EmbeddedLikeC4View({ viewId, injectStyles = true, ...props }) {
        return jsxs(Fragment, { children: [injectStyles === true && jsx(InjectStyles, {}), jsx(EmbeddedLikeC4Diagram, { viewId: viewId, views: LikeC4Views, ...props })] });
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
        /**
         * @default true
         */
        injectStyles?: boolean | undefined;
    } & Omit<LikeC4DiagramProps, "view">;
    export declare function LikeC4View({ viewId, injectStyles, ...props }: LikeC4ViewProps): JSX.Element;

    export type EmbeddedLikeC4ViewProps = {
        viewId: LikeC4ViewId;
        /**
         * @default true
         */
        injectStyles?: boolean | undefined;
    } & Omit<EmbeddedLikeC4DiagramProps, "viewId" | "views">;
    export declare function EmbeddedLikeC4View({ viewId, injectStyles, ...props }: EmbeddedLikeC4ViewProps): JSX.Element;

    export * from "./views";
    export type { LikeC4DiagramProps, EmbeddedLikeC4DiagramProps } from "@likec4/diagram";
  `
  return {
    js: toString(js),
    dts: toString(dts)
  }
}
