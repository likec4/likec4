"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelationshipColors = void 0;
var gray = {
    line: '#8D8D8D',
    labelBg: '#18191B',
    label: '#C9C9C9',
};
var slate = {
    line: '#64748b', // 500
    labelBg: '#0f172a', // 900
    label: '#cbd5e1', // 300
};
var blue = {
    line: '#3b82f6', // 500
    labelBg: '#172554', // 950
    label: '#60a5fa', // 400
};
var sky = {
    line: '#0ea5e9', // 500
    labelBg: '#082f49', // 950
    label: '#38bdf8', // 400
};
exports.RelationshipColors = {
    amber: {
        line: '#b45309',
        labelBg: '#78350f',
        label: '#FFE0C2',
    },
    blue: blue,
    gray: gray,
    green: {
        line: '#15803d', // 700
        labelBg: '#052e16', // 950
        label: '#22c55e', // 500
    },
    indigo: {
        line: '#6366f1', // 500
        labelBg: '#1e1b4b', // 950
        label: '#818cf8', // 400
    },
    muted: slate,
    primary: blue,
    red: {
        line: '#AC4D39',
        labelBg: '#b91c1c',
        label: '#f5b2a3',
    },
    secondary: sky,
    sky: sky,
    slate: slate,
};
