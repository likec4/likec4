"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElementShape = ElementShape;
var core_1 = require("@likec4/core");
var recipes_1 = require("@likec4/styles/recipes");
var utils_1 = require("../../utils");
function cylinderSVGPath(diameter, height, tilt) {
    if (tilt === void 0) { tilt = 0.07; }
    var radius = Math.round(diameter / 2);
    // const tiltAdjustedHeight = height * Math.cos((tilt * Math.PI) / 2)
    var rx = radius;
    var ry = (0, utils_1.roundDpr)(tilt * radius);
    var tiltAdjustedHeight = height - 2 * ry;
    var path = "  M ".concat(diameter, ",").concat(ry, "\n        a ").concat(rx, ",").concat(ry, " 0,0,0 ").concat(-diameter, " 0\n        l 0,").concat(tiltAdjustedHeight, "\n        a ").concat(rx, ",").concat(ry, " 0,0,0 ").concat(diameter, " 0\n        l 0,").concat(-tiltAdjustedHeight, "\n        z\n        ")
        .replace(/\s+/g, ' ')
        .trim();
    return {
        path: path,
        ry: ry,
        rx: rx,
    };
}
function docSVGPath(width, height) {
    var waveHeight = height / 8;
    var baseY = (0, utils_1.roundDpr)(height - waveHeight / 2);
    var amplitude = (0, utils_1.roundDpr)(height / 6);
    var radius = 6;
    var path = "\n    M 0 ".concat(baseY, "\n    V ").concat(radius, "\n    Q 0 0 ").concat(radius, " 0\n    H ").concat(width - radius, "\n    Q ").concat(width, " 0 ").concat(width, " ").concat(radius, "\n    V ").concat(baseY, "\n    C ").concat((0, utils_1.roundDpr)(width * 0.75), " ").concat(baseY + amplitude, ", ").concat((0, utils_1.roundDpr)(width * 0.5), " ").concat(baseY - amplitude, ", 0 ").concat(baseY, "\n  ")
        .replace(/\s+/g, ' ')
        .trim();
    return {
        path: path,
    };
}
function bucketSVGPath(width, height) {
    var cx = width / 2;
    var topRx = (0, utils_1.roundDpr)(cx);
    var topRy = (0, utils_1.roundDpr)(Math.min(height / 8, topRx * 0.08));
    var bottomRx = (0, utils_1.roundDpr)(topRx * 0.8);
    var bottomRy = (0, utils_1.roundDpr)(topRy * 1.05);
    var topY = topRy;
    var bottomY = height - bottomRy;
    var leftBottomX = cx - bottomRx;
    var path = "\n    M ".concat(width, ",").concat(topY, "\n    a ").concat(topRx, ",").concat(topRy, " 0,0,0 ").concat(-width, " 0\n    L ").concat(leftBottomX, ",").concat(bottomY, "\n    a ").concat(bottomRx, ",").concat(bottomRy, " 0,0,0 ").concat(bottomRx * 2, " 0\n    Z\n  ")
        .replace(/\s+/g, ' ')
        .trim();
    return {
        path: path,
        topRx: topRx,
        topRy: topRy,
        bottomRx: bottomRx,
        bottomRy: bottomRy,
    };
}
function queueSVGPath(width, height, tilt) {
    if (tilt === void 0) { tilt = 0.185; }
    var diameter = height;
    var radius = Math.round(diameter / 2);
    var ry = radius;
    var rx = (0, utils_1.roundDpr)((diameter / 2) * tilt);
    var tiltAdjustedWidth = width - 2 * rx;
    var path = "\n    M ".concat(rx, ",0\n    a ").concat(rx, ",").concat(ry, " 0,0,0 0 ").concat(diameter, "\n    l ").concat(tiltAdjustedWidth, ",0\n    a ").concat(rx, ",").concat(ry, " 0,0,0 0 ").concat(-diameter, "\n    z")
        .replace(/\s+/g, ' ')
        .trim();
    return {
        path: path,
        ry: ry,
        rx: rx,
    };
}
var PersonIcon = {
    width: 115,
    height: 120,
    path: "M57.9197 0C10.9124 0 33.5766 54.75 33.5766 54.75C38.6131 62.25 45.3285 60.75 45.3285 66C45.3285 70.5 39.4526 72 33.5766 72.75C24.3431 72.75 15.9489 71.25 7.55474 84.75C2.51825 93 0 120 0 120H115C115 120 112.482 93 108.285 84.75C99.8905 70.5 91.4963 72.75 82.2628 72C76.3869 71.25 70.5109 69.75 70.5109 65.25C70.5109 60.75 77.2263 62.25 82.2628 54C82.2628 54.75 104.927 0 57.9197 0V0Z",
};
var ComponentTopLeftRect = function (_a) {
    var index = _a.index, size = _a.size;
    var width, height, offsetX, offsetY, between;
    switch (size) {
        case 'xs':
        case 'sm': {
            width = 40;
            height = 18;
            offsetX = -16;
            offsetY = 16;
            between = 10;
            break;
        }
        case 'md': {
            width = 60;
            height = 26;
            offsetX = -20;
            offsetY = 22;
            between = 14;
            break;
        }
        case 'lg':
        case 'xl': {
            width = 70;
            height = 32;
            offsetX = -24;
            offsetY = 32;
            between = 18;
            break;
        }
        default: {
            (0, core_1.nonexhaustive)(size);
        }
    }
    return (<rect x={offsetX} y={offsetY + (height + between) * index} width={width} height={height} rx={3} className="top-left-rect" strokeWidth={2}/>);
};
function ShapeSvg(_a) {
    var shape = _a.shape, w = _a.w, h = _a.h, _b = _a.size, size = _b === void 0 ? 'md' : _b;
    switch (shape) {
        case 'component': {
            return (<>
          <rect width={w} height={h} rx={6} strokeWidth={0}/>
          <ComponentTopLeftRect index={0} size={size}/>
          <ComponentTopLeftRect index={1} size={size}/>
        </>);
        }
        case 'mobile': {
            return (<>
          <rect width={w} height={h} rx={6} data-likec4-fill="mix-stroke" strokeWidth={0}/>
          <g data-likec4-fill="fill" strokeWidth={0}>
            <circle cx={17} cy={h / 2} r={12}/>
            <rect x={33} y={12} width={w - 44} height={h - 24} rx={5}/>
          </g>
        </>);
        }
        case 'document': {
            var path = docSVGPath(w, h).path;
            return (<path d={path} data-likec4-fill="fill" strokeWidth={2}/>);
        }
        case 'browser': {
            return (<>
          <rect width={w} height={h} rx={6} data-likec4-fill="mix-stroke" strokeWidth={0}/>
          <g data-likec4-fill="fill" strokeWidth={0}>
            <circle cx={16} cy={17} r={7}/>
            <circle cx={36} cy={17} r={7}/>
            <circle cx={56} cy={17} r={7}/>
            <rect x={70} y={8} width={w - 80} height={17} rx={4}/>
            <rect x={10} y={32} width={w - 20} height={h - 42} rx={4}/>
          </g>
        </>);
        }
        case 'person': {
            return (<>
          <rect width={w} height={h} rx={6} strokeWidth={0}/>
          <svg x={w - PersonIcon.width - 6} y={h - PersonIcon.height} width={PersonIcon.width} height={PersonIcon.height} viewBox={"0 0 ".concat(PersonIcon.width, " ").concat(PersonIcon.height)} data-likec4-fill="mix-stroke">
            <path strokeWidth={0} d={PersonIcon.path}/>
          </svg>
        </>);
        }
        case 'queue': {
            var _c = queueSVGPath(w, h), path = _c.path, rx = _c.rx, ry = _c.ry;
            return (<>
          <path d={path} strokeWidth={2}/>
          <ellipse cx={rx} cy={ry} ry={ry - 0.75} rx={rx} data-likec4-fill="mix-stroke" strokeWidth={2}/>
        </>);
        }
        case 'bucket': {
            var _d = bucketSVGPath(w, h), path = _d.path, topRx = _d.topRx, topRy = _d.topRy;
            return (<>
          <path d={path} strokeWidth={2}/>
          <ellipse cx={w / 2} cy={topRy} rx={topRx} ry={topRy} data-likec4-fill="mix-stroke" strokeWidth={2}/>
        </>);
        }
        case 'storage':
        case 'cylinder': {
            var _e = cylinderSVGPath(w, h), path = _e.path, rx = _e.rx, ry = _e.ry;
            return (<>
          <path d={path} strokeWidth={2}/>
          <ellipse cx={rx} cy={ry} ry={ry} rx={rx - 0.75} data-likec4-fill="mix-stroke" strokeWidth={2}/>
        </>);
        }
        default: {
            return (0, core_1.nonexhaustive)(shape);
        }
    }
}
/**
 * When element is selected, this component is used to render the indicator
 */
function ShapeSvgOutline(_a) {
    var shape = _a.shape, w = _a.w, h = _a.h;
    var svg;
    switch (shape) {
        case 'bucket':
            svg = (<g transform="translate(-3 -3)">
          <path d={bucketSVGPath(w + 6, h + 6).path}/>
        </g>);
            break;
        case 'queue':
            svg = (<g transform="translate(-3 -3)">
          <path d={queueSVGPath(w + 6, h + 6).path}/>
        </g>);
            break;
        case 'document':
            svg = (<g transform="translate(-3 -3)">
          <path d={docSVGPath(w + 6, h + 6).path}/>
        </g>);
            break;
        case 'storage':
        case 'cylinder': {
            svg = (<g transform="translate(-3 -3)">
          <path d={cylinderSVGPath(w + 6, h + 6).path}/>
        </g>);
            break;
        }
        default: {
            svg = (<rect x={-3} y={-3} width={w + 6} height={h + 6} rx={8}/>);
            break;
        }
    }
    return <g className={'likec4-shape-outline'}>{svg}</g>;
}
function ElementShape(_a) {
    var _b, _c, _d, _e, _f, _g;
    var data = _a.data, width = _a.width, height = _a.height, _h = _a.showSeletionOutline, showSeletionOutline = _h === void 0 ? true : _h;
    var w = !!width && width > 10 ? width : data.width;
    var h = !!height && height > 10 ? height : data.height;
    var isMultiple = (_c = (_b = data.style) === null || _b === void 0 ? void 0 : _b.multiple) !== null && _c !== void 0 ? _c : false;
    var borderStyle = (_e = (_d = data.style) === null || _d === void 0 ? void 0 : _d.border) !== null && _e !== void 0 ? _e : 'none';
    var withBorder = borderStyle !== 'none';
    if (data.shape === 'rectangle') {
        return (<div style={{
                borderStyle: borderStyle,
            }} className={(0, recipes_1.elementShapeRecipe)({
                shapetype: 'html',
                withBorder: withBorder,
                withOutline: showSeletionOutline,
            })}>
        {isMultiple && <div className={'likec4-shape-multiple'}/>}
        <div className={'likec4-shape-outline'}/>
      </div>);
    }
    var className = (0, recipes_1.elementShapeRecipe)({
        shapetype: 'svg',
        withOutline: showSeletionOutline,
    });
    return (<>
      {isMultiple && (<svg className={className} data-likec4-shape-multiple="true" viewBox={"0 0 ".concat(w, " ").concat(h)}>
          <ShapeSvg shape={data.shape} size={(_f = data.style) === null || _f === void 0 ? void 0 : _f.size} w={w} h={h}/>
        </svg>)}
      <svg className={className} viewBox={"0 0 ".concat(w, " ").concat(h)}>
        <ShapeSvgOutline shape={data.shape} w={w} h={h}/>
        <ShapeSvg shape={data.shape} size={(_g = data.style) === null || _g === void 0 ? void 0 : _g.size} w={w} h={h}/>
      </svg>
    </>);
}
