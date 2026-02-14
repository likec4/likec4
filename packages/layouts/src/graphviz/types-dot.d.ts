import type { EdgeId, Fqn } from '@likec4/core';
import type { Tagged } from 'type-fest';
export type GvNodeName = Tagged<string, 'GvNodeName'>;
export type GvId = Tagged<number, 'GvId'>;
export type Inches = Tagged<string, 'Inches'>;
export type Point = [x: number, y: number];
export interface GVPos {
    x: number;
    y: number;
}
export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface GraphvizJson {
    name: GvNodeName;
    directed: boolean;
    strict: boolean;
    _draw_: GraphvizJson.Draw[];
    bb: string;
    compound: string;
    fontname: string;
    fontsize: string;
    label: string;
    nodesep: string;
    outputorder: string;
    rankdir: string;
    ranksep: string;
    splines: string;
    xdotversion: string;
    _subgraph_cnt: number;
    objects?: GraphvizJson.GvObject[];
    edges?: GraphvizJson.Edge[];
}
export declare namespace GraphvizJson {
    interface Draw {
        op: string;
        grad: string;
        color: string;
        points: Point[];
    }
    interface Draw2 {
        op: string;
        grad: string;
        color: string;
        points: Point[];
    }
    namespace DrawOps {
        type Style = {
            op: 'S';
            style: string;
        };
        type BSpline = {
            op: 'b' | 'B';
            points: Point[];
        };
        type Color = {
            op: 'c';
            grad: string;
            color: string;
        };
        type Polygon = {
            op: 'p' | 'P';
            points: Point[];
        };
    }
    type DrawOp = DrawOps.Style | DrawOps.BSpline | DrawOps.Color | DrawOps.Polygon;
    type LabelDrawOps = {
        op: 'F';
        size: number;
        face: string;
    } | {
        op: 'c';
        color: string;
    } | {
        op: 't';
        fontchar: number;
    } | {
        op: 'T';
        pt: Point;
        align: 'l' | 'r' | 'c';
        width: number;
        text: string;
    };
    type GvObject = GvNodeObject | GvSubgraph;
    interface GvSubgraph {
        bb: string;
        label?: string;
        compound: 'true';
        _ldraw_?: LabelDrawOps[];
        likec4_type?: 'folder' | 'file';
        likec4_path?: string;
        likec4_id?: Fqn;
        likec4_level?: number;
        likec4_depth?: number;
        _gvid: GvId;
        subgraphs?: GvId[];
        nodes?: GvId[];
        edges?: GvId[];
    }
    interface GvNodeObject {
        _draw_: Draw[];
        _ldraw_?: LabelDrawOps[];
        likec4_type?: 'folder' | 'file' | 'view';
        likec4_path?: string;
        likec4_id?: Fqn;
        likec4_level?: number;
        _gvid: GvId;
        height: string;
        pos: string;
        shape: 'rect';
        width: string;
        label?: string;
    }
    interface Draw3 {
        op: string;
        grad: string;
        color: string;
        points: Point[];
    }
    interface Hdraw {
        op: string;
        style: string;
        grad: string;
        color: string;
        points: Point[];
    }
    interface Edge {
        _gvid: GvId;
        tail: GvId;
        head: GvId;
        dir?: 'forward' | 'back' | 'both' | 'none';
        _draw_: DrawOp[];
        _hdraw_?: DrawOp[];
        _tdraw_?: DrawOp[];
        _ldraw_?: LabelDrawOps[];
        _tldraw_?: LabelDrawOps[];
        _hldraw_?: LabelDrawOps[];
        fontname: string;
        fontsize: string;
        likec4_id?: EdgeId;
        label: string;
        lp: string;
        nojustify?: 'true' | 'false';
        pos?: string;
    }
}
