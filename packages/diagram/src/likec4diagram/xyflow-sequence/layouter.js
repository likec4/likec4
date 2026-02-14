"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var _SequenceViewLayouter_solver, _SequenceViewLayouter_actors, _SequenceViewLayouter_compounds, _SequenceViewLayouter_viewportRight, _SequenceViewLayouter_viewportBottom, _SequenceViewLayouter_rowsTop, _SequenceViewLayouter_rows, _SequenceViewLayouter_parallelBoxes;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SequenceViewLayouter = void 0;
var utils_1 = require("@likec4/core/utils");
var kiwi = require("@lume/kiwi");
var remeda_1 = require("remeda");
var const_1 = require("./const");
var utils_2 = require("./utils");
var SequenceViewLayouter = /** @class */ (function () {
    function SequenceViewLayouter(_a) {
        var _b;
        var actors = _a.actors, steps = _a.steps, compounds = _a.compounds;
        var _this = this;
        var _c, _d;
        _SequenceViewLayouter_solver.set(this, new kiwi.Solver());
        _SequenceViewLayouter_actors.set(this, void 0);
        _SequenceViewLayouter_compounds.set(this, []);
        _SequenceViewLayouter_viewportRight.set(this, void 0);
        _SequenceViewLayouter_viewportBottom.set(this, void 0);
        _SequenceViewLayouter_rowsTop.set(this, void 0);
        _SequenceViewLayouter_rows.set(this, []);
        _SequenceViewLayouter_parallelBoxes.set(this, []);
        __classPrivateFieldSet(this, _SequenceViewLayouter_rowsTop, this.newVar(const_1.FIRST_STEP_OFFSET), "f");
        __classPrivateFieldSet(this, _SequenceViewLayouter_viewportRight, this.newVar(0), "f");
        __classPrivateFieldSet(this, _SequenceViewLayouter_viewportBottom, this.newVar(0), "f");
        __classPrivateFieldSet(this, _SequenceViewLayouter_actors, this.addActors(actors), "f");
        for (var _i = 0, compounds_1 = compounds; _i < compounds_1.length; _i++) {
            var compound = compounds_1[_i];
            var result = this.addCompound(compound);
            var toplevel = result[0];
            // ensure that the top level compound is at the top
            this.constraint(toplevel.y1, '==', 0, kiwi.Strength.strong);
            this.put(__classPrivateFieldGet(this, _SequenceViewLayouter_viewportBottom, "f")).after(toplevel.bottom);
            this.put(__classPrivateFieldGet(this, _SequenceViewLayouter_rowsTop, "f")).after(toplevel.y2);
            (_b = __classPrivateFieldGet(this, _SequenceViewLayouter_compounds, "f")).push.apply(_b, result);
        }
        for (var _e = 0, steps_1 = steps; _e < steps_1.length; _e++) {
            var step = steps_1[_e];
            this.addStep(step);
        }
        for (var _f = 0, _g = (0, utils_2.findParallelRects)(steps); _f < _g.length; _f++) {
            var parallelRect = _g[_f];
            this.addParallelRect(parallelRect);
        }
        var firstActor = __classPrivateFieldGet(this, _SequenceViewLayouter_actors, "f")[0];
        this.constraint(firstActor.offset.left, '==', 0, kiwi.Strength.strong);
        var lastActor = __classPrivateFieldGet(this, _SequenceViewLayouter_actors, "f").reduce(function (prev, actor) {
            _this.put(actor.x).after(prev.right, const_1.ACTOR_GAP);
            _this.put(actor.offset.left, kiwi.Strength.strong).after(prev.offset.right, const_1.COLUMN_GAP);
            _this.constraint(actor.centerY, '==', prev.centerY, kiwi.Strength.strong);
            _this.put(__classPrivateFieldGet(_this, _SequenceViewLayouter_rowsTop, "f")).after(actor.offset.bottom);
            return actor;
        });
        this.put(__classPrivateFieldGet(this, _SequenceViewLayouter_viewportRight, "f")).after(lastActor.offset.right);
        this.put(__classPrivateFieldGet(this, _SequenceViewLayouter_viewportBottom, "f")).after((_d = (_c = (0, remeda_1.last)(__classPrivateFieldGet(this, _SequenceViewLayouter_rows, "f"))) === null || _c === void 0 ? void 0 : _c.bottom) !== null && _d !== void 0 ? _d : __classPrivateFieldGet(this, _SequenceViewLayouter_rowsTop, "f"));
        if (compounds.length > 0) {
            for (var _h = 0, _j = __classPrivateFieldGet(this, _SequenceViewLayouter_compounds, "f"); _h < _j.length; _h++) {
                var compound = _j[_h];
                var from = compound.from.column;
                var to = compound.to.column;
                var maxRow = Math.max(compound.from.maxRow, compound.to.maxRow);
                for (var i = from + 1; i < to; i++) {
                    var actorBox = this.actorBox(i);
                    maxRow = Math.max(maxRow, actorBox.maxRow);
                }
                var lastRow = (0, utils_1.nonNullable)(__classPrivateFieldGet(this, _SequenceViewLayouter_rows, "f")[maxRow], "row ".concat(maxRow, " not found"));
                this.put(compound.bottom).after(lastRow.bottom, 16);
                this.put(__classPrivateFieldGet(this, _SequenceViewLayouter_viewportBottom, "f")).after(compound.bottom);
            }
        }
        __classPrivateFieldGet(this, _SequenceViewLayouter_solver, "f").updateVariables();
    }
    SequenceViewLayouter.prototype.getParallelBoxes = function () {
        return __classPrivateFieldGet(this, _SequenceViewLayouter_parallelBoxes, "f").map(function (_a) {
            var parallelPrefix = _a.parallelPrefix, x1 = _a.x1, y1 = _a.y1, x2 = _a.x2, y2 = _a.y2;
            return ({
                parallelPrefix: parallelPrefix,
                x: x1.value(),
                y: y1.value(),
                width: x2.value() - x1.value(),
                height: y2.value() - y1.value(),
            });
        });
    };
    SequenceViewLayouter.prototype.getActorBox = function (actor) {
        var actorBox = this.actorBox(actor);
        return {
            x: actorBox.x.value(),
            y: actorBox.y.value(),
            width: actorBox.width,
            height: actorBox.height,
        };
    };
    SequenceViewLayouter.prototype.getCompoundBoxes = function () {
        return __classPrivateFieldGet(this, _SequenceViewLayouter_compounds, "f").map(function (_a) {
            var node = _a.node, depth = _a.depth, x1 = _a.x1, y1 = _a.y1, x2 = _a.x2, bottom = _a.bottom;
            return ({
                node: node,
                depth: depth,
                x: x1.value(),
                y: y1.value(),
                width: x2.value() - x1.value(),
                height: bottom.value() - y1.value(),
            });
        });
    };
    SequenceViewLayouter.prototype.getPortCenter = function (step, type) {
        var _a = type === 'source' ? step.from : step.to, column = _a.column, row = _a.row;
        var x = this.actorBox(column).centerX;
        var y = (0, utils_1.nonNullable)(__classPrivateFieldGet(this, _SequenceViewLayouter_rows, "f")[row]).y;
        return {
            cx: x.value(),
            cy: y.value() + const_1.PORT_HEIGHT / 2 + step.offset,
            height: type === 'source' ? 40 : 24,
        };
    };
    SequenceViewLayouter.prototype.getViewBounds = function () {
        return {
            x: 0,
            y: 0,
            width: __classPrivateFieldGet(this, _SequenceViewLayouter_viewportRight, "f").value(),
            height: __classPrivateFieldGet(this, _SequenceViewLayouter_viewportBottom, "f").value(), // Max Y,
        };
    };
    SequenceViewLayouter.prototype.actorBox = function (actor) {
        if (typeof actor !== 'number') {
            var id_1 = typeof actor === 'string' ? actor : actor.id;
            actor = __classPrivateFieldGet(this, _SequenceViewLayouter_actors, "f").findIndex(function (a) { return a.actor.id === id_1; });
            (0, utils_1.invariant)(actor >= 0, "actor ".concat(id_1, " not found"));
        }
        return (0, utils_1.nonNullable)(__classPrivateFieldGet(this, _SequenceViewLayouter_actors, "f")[actor], "actor at index ".concat(actor, " not found"));
    };
    SequenceViewLayouter.prototype.addActors = function (actors) {
        var _this = this;
        var accX = 0;
        return (0, remeda_1.map)(actors, function (actor, column) {
            var x = _this.newVar(accX);
            accX += actor.width + const_1.ACTOR_GAP;
            var y = _this.newVar(0);
            var actorBox = {
                column: column,
                actor: actor,
                x: x,
                y: y,
                centerX: x.plus(Math.round(actor.width / 2)),
                centerY: y.plus(Math.round(actor.height / 2)),
                width: actor.width,
                height: actor.height,
                right: x.plus(actor.width),
                bottom: y.plus(actor.height),
                minRow: Infinity,
                maxRow: -Infinity,
            };
            // Create variables for offsets
            var top = _this.newVar(0), left = _this.newVar(0), right = _this.newVar(0), bottom = _this.newVar(0);
            _this.put(top, kiwi.Strength.strong).before(y);
            _this.put(left, kiwi.Strength.strong).before(x);
            _this.put(right, kiwi.Strength.strong).after(actorBox.right);
            _this.put(bottom, kiwi.Strength.strong).after(actorBox.bottom);
            return __assign(__assign({}, actorBox), { offset: {
                    top: top,
                    left: left,
                    right: right,
                    bottom: bottom,
                } });
        });
    };
    SequenceViewLayouter.prototype.addStep = function (step) {
        var _a, _b, _c;
        var source = this.actorBox(step.source);
        var target = this.actorBox(step.target);
        source.minRow = Math.min(source.minRow, step.from.row);
        source.maxRow = Math.max(source.maxRow, step.from.row);
        target.minRow = Math.min(target.minRow, step.to.row);
        target.maxRow = Math.max(target.maxRow, step.to.row);
        var _d = source.column <= target.column
            ? [source, target]
            : [target, source], left = _d[0], right = _d[1];
        var width = ((_b = (_a = step.label) === null || _a === void 0 ? void 0 : _a.width) !== null && _b !== void 0 ? _b : 100) + const_1.STEP_LABEL_MARGIN;
        if (left !== right) {
            this.constraint(left.centerX.plus(width), '<=', right.centerX);
        }
        else {
            this.constraint(left.centerX.plus(width), '<=', left.offset.right);
        }
        var height = ((_c = step.label) === null || _c === void 0 ? void 0 : _c.height) ? step.label.height + const_1.STEP_LABEL_MARGIN + const_1.PORT_HEIGHT / 2 : const_1.MIN_ROW_HEIGHT;
        height = Math.max(height, const_1.MIN_ROW_HEIGHT) + step.offset;
        this.ensureRow(step.from.row, height);
        if (step.isSelfLoop) {
            this.ensureRow(step.to.row, const_1.MIN_ROW_HEIGHT);
        }
        return this;
    };
    SequenceViewLayouter.prototype.addParallelRect = function (_a) {
        var parallelPrefix = _a.parallelPrefix, min = _a.min, max = _a.max;
        var x1 = this.actorBox(min.column).centerX.minus(30);
        var x2 = this.actorBox(max.column).centerX.plus(30);
        var firstRow = __classPrivateFieldGet(this, _SequenceViewLayouter_rows, "f")[min.row];
        var lastRow = __classPrivateFieldGet(this, _SequenceViewLayouter_rows, "f")[max.row];
        (0, utils_1.invariant)(firstRow && lastRow, "parallel box invalid minRow=".concat(min.row, " maxRow=").concat(max.row));
        var y1 = this.newVar(0);
        this.put(y1).before(firstRow.y, 40);
        var y2 = lastRow.bottom;
        // margin top
        var rowBefore = min.row > 0 && __classPrivateFieldGet(this, _SequenceViewLayouter_rows, "f")[min.row - 1];
        if (rowBefore) {
            this.put(y1).after(rowBefore.bottom, 16);
        }
        var rowAfter = max.row < __classPrivateFieldGet(this, _SequenceViewLayouter_rows, "f").length - 1 && __classPrivateFieldGet(this, _SequenceViewLayouter_rows, "f")[max.row + 1];
        if (rowAfter) {
            this.put(y2).before(rowAfter.y, 16);
        }
        __classPrivateFieldGet(this, _SequenceViewLayouter_parallelBoxes, "f").push({
            parallelPrefix: parallelPrefix,
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
        });
    };
    SequenceViewLayouter.prototype.addCompound = function (compound) {
        var _this = this;
        var PADDING = 32;
        var PADDING_TOP = 40;
        var PADDING_TOP_FROM_ACTOR = 52;
        var children = [];
        var nested = compound.nested.flatMap(function (c) {
            var result = _this.addCompound(c);
            // first is the direct child
            children.push(result[0]);
            return result;
        });
        var depth = Math.max.apply(Math, __spreadArray(__spreadArray([], nested.map(function (c) { return c.depth + 1; }), false), [0], false));
        var from = this.actorBox(compound.from);
        var to = this.actorBox(compound.to);
        var x1 = from.offset.left.minus(PADDING);
        from.offset.left = x1; // change offset
        var x2 = to.offset.right.plus(PADDING);
        to.offset.right = x2; // change offset
        var bottom = this.newVar(0);
        var onlyChild = (0, remeda_1.only)(children);
        var y1, y2;
        switch (true) {
            case !!onlyChild: {
                y1 = onlyChild.y1.minus(PADDING_TOP);
                y2 = onlyChild.y2.plus(PADDING);
                this.put(bottom).after(onlyChild.bottom, PADDING);
                break;
            }
            // Compound with single actor
            case to === from: {
                y1 = this.newVar(0);
                y2 = this.newVar(0);
                this.put(y1).before(from.offset.top, PADDING_TOP_FROM_ACTOR);
                this.put(y2).after(from.offset.bottom, PADDING);
                this.put(bottom).after(y2);
                break;
            }
            // Compound nested compound, offset from it
            case children.length > 0: {
                y1 = this.newVar(0);
                y2 = this.newVar(0);
                for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
                    var child = children_1[_i];
                    this.put(y1).before(child.y1, PADDING);
                    this.put(y2).after(child.y2, PADDING);
                    this.put(bottom).after(child.bottom, PADDING);
                }
                break;
            }
            default: {
                y1 = this.newVar(0);
                y2 = this.newVar(0);
                for (var col = from.column; col <= to.column; col++) {
                    var offset = this.actorBox(col).offset;
                    this.put(y1).before(offset.top, PADDING_TOP_FROM_ACTOR);
                    this.put(y2).after(offset.bottom, PADDING);
                }
                this.put(bottom).after(y2);
                break;
            }
        }
        for (var col = from.column; col <= to.column; col++) {
            var offset = this.actorBox(col).offset;
            offset.top = y1;
            offset.bottom = y2;
        }
        return __spreadArray([
            {
                node: compound.node,
                depth: depth,
                from: from,
                to: to,
                x1: x1,
                y1: y1,
                x2: x2,
                y2: y2,
                bottom: bottom,
            }
        ], nested, true);
    };
    SequenceViewLayouter.prototype.ensureRow = function (row, rowHeight) {
        var _a;
        while (row >= __classPrivateFieldGet(this, _SequenceViewLayouter_rows, "f").length) {
            var prevRowY = __classPrivateFieldGet(this, _SequenceViewLayouter_rows, "f").length > 0 && ((_a = __classPrivateFieldGet(this, _SequenceViewLayouter_rows, "f")[__classPrivateFieldGet(this, _SequenceViewLayouter_rows, "f").length - 1]) === null || _a === void 0 ? void 0 : _a.bottom) ||
                __classPrivateFieldGet(this, _SequenceViewLayouter_rowsTop, "f").plus(const_1.FIRST_STEP_OFFSET);
            var y = this.newVar(__classPrivateFieldGet(this, _SequenceViewLayouter_rows, "f").length * const_1.MIN_ROW_HEIGHT);
            this.put(y).after(prevRowY);
            var height = this.newVar(const_1.MIN_ROW_HEIGHT);
            this.require(height, '>=', const_1.MIN_ROW_HEIGHT);
            __classPrivateFieldGet(this, _SequenceViewLayouter_rows, "f").push({
                y: y,
                height: height,
                bottom: y.plus(height),
                lastHeight: const_1.MIN_ROW_HEIGHT,
            });
        }
        var rowVar = (0, utils_1.nonNullable)(__classPrivateFieldGet(this, _SequenceViewLayouter_rows, "f")[row]);
        if (rowHeight > rowVar.lastHeight) {
            rowVar.lastHeight = rowHeight;
            this.require(rowVar.height, '>=', rowHeight);
            __classPrivateFieldGet(this, _SequenceViewLayouter_solver, "f").suggestValue(rowVar.height, rowHeight);
        }
    };
    SequenceViewLayouter.prototype.newVar = function (initialValue) {
        var v = new kiwi.Variable();
        __classPrivateFieldGet(this, _SequenceViewLayouter_solver, "f").addEditVariable(v, kiwi.Strength.weak);
        if (typeof initialValue === 'number') {
            __classPrivateFieldGet(this, _SequenceViewLayouter_solver, "f").suggestValue(v, initialValue);
            this.constraint(v, '>=', 0, kiwi.Strength.strong);
        }
        return v;
    };
    /**
     * Adds a required constraint:
     * Also adds a weak constraint == if the operator is <= or >=
     */
    SequenceViewLayouter.prototype.require = function (left, op, right) {
        if (right === void 0) { right = undefined; }
        this.constraint(left, op, right, kiwi.Strength.required);
        switch (op) {
            case '<=':
            case '>=':
                this.constraint(left, '==', right, kiwi.Strength.weak);
                break;
            case '<= 0':
            case '>= 0':
                this.constraint(left, '== 0', undefined, kiwi.Strength.weak);
                break;
        }
    };
    /**
     * Adds a constraint with medium strength by default
     */
    SequenceViewLayouter.prototype.constraint = function (left, op, right, strength) {
        if (right === void 0) { right = undefined; }
        if (strength === void 0) { strength = kiwi.Strength.medium; }
        var operator;
        switch (op) {
            case '==':
                operator = kiwi.Operator.Eq;
                break;
            case '>=':
                operator = kiwi.Operator.Ge;
                break;
            case '<=':
                operator = kiwi.Operator.Le;
                break;
            case '== 0': {
                operator = kiwi.Operator.Eq;
                right = 0;
                break;
            }
            case '>= 0': {
                operator = kiwi.Operator.Ge;
                right = 0;
                break;
            }
            case '<= 0': {
                operator = kiwi.Operator.Le;
                right = 0;
                break;
            }
            default:
                (0, utils_1.nonexhaustive)(op);
        }
        __classPrivateFieldGet(this, _SequenceViewLayouter_solver, "f").addConstraint(new kiwi.Constraint(left, operator, right !== null && right !== void 0 ? right : 0, strength));
    };
    SequenceViewLayouter.prototype.put = function (variable, strength) {
        var _this = this;
        if (strength === void 0) { strength = kiwi.Strength.required; }
        var eqStrength = strength === kiwi.Strength.required ? kiwi.Strength.medium : kiwi.Strength.weak;
        return {
            before: function (other, gap) {
                if (gap) {
                    other = other.minus(gap);
                }
                _this.constraint(variable, '<=', other, strength);
                _this.constraint(variable, '==', other, eqStrength);
            },
            after: function (other, gap) {
                if (gap) {
                    other = other.plus(gap);
                }
                _this.constraint(variable, '>=', other, strength);
                _this.constraint(variable, '==', other, eqStrength);
            },
        };
    };
    return SequenceViewLayouter;
}());
exports.SequenceViewLayouter = SequenceViewLayouter;
_SequenceViewLayouter_solver = new WeakMap(), _SequenceViewLayouter_actors = new WeakMap(), _SequenceViewLayouter_compounds = new WeakMap(), _SequenceViewLayouter_viewportRight = new WeakMap(), _SequenceViewLayouter_viewportBottom = new WeakMap(), _SequenceViewLayouter_rowsTop = new WeakMap(), _SequenceViewLayouter_rows = new WeakMap(), _SequenceViewLayouter_parallelBoxes = new WeakMap();
