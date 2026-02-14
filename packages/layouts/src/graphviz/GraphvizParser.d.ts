import { type ComputedView, type LayoutedView } from '@likec4/core';
import type { ComputedProjectsView, LayoutedProjectsView } from '@likec4/core/compute-view';
import type { GraphvizJson } from './types-dot';
export declare function parseGraphvizJson(graphvizJson: GraphvizJson, computedView: ComputedView): LayoutedView;
export declare function parseGraphvizJsonOfProjectsView(graphvizJson: GraphvizJson, computed: ComputedProjectsView): LayoutedProjectsView;
