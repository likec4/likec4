"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewRulesPanel = ViewRulesPanel;
var core_1 = require("@likec4/core");
var css_1 = require("@likec4/styles/css");
var jsx_1 = require("@likec4/styles/jsx");
var patterns_1 = require("@likec4/styles/patterns");
var core_2 = require("@mantine/core");
var icons_react_1 = require("@tabler/icons-react");
var react_1 = require("motion/react");
var useLikeC4Model_1 = require("../../hooks/useLikeC4Model");
function ViewRulesPanel(_a) {
    var rules = _a.rules, onToggle = _a.onToggle, onDelete = _a.onDelete;
    return (<jsx_1.Box p="1">
      <jsx_1.styled.h4 mt="0" fontSize="md" fontWeight="normal">View Rules</jsx_1.styled.h4>
      <react_1.AnimatePresence mode="popLayout" propagate>
        <react_1.LayoutGroup>
          <react_1.m.div layout layoutRoot className={(0, patterns_1.vstack)({ gap: '1' })}>
            {rules.map(function (rule) { return (<react_1.m.div layout="position" key={rule.id} onClick={function () {
                return onToggle(rule);
            }} initial={{
                opacity: 0,
                y: -50,
            }} animate={{
                opacity: rule.enabled ? 1 : 0.5,
                scale: rule.enabled ? 1 : 0.98,
                y: 0,
            }} exit={{
                opacity: 0,
                scale: 0.95,
                y: -50,
            }} className={(0, css_1.cx)((0, patterns_1.hstack)({
                p: '1',
                px: '2',
                flexWrap: 'nowrap',
                rounded: 'sm',
                colorPalette: 'teal',
                // colorPalette: rule.type === 'include' ? 'green' : 'red',
                gap: '2',
                border: 'default',
                // opacity: rule.enabled ? 1 : 0.5,
            }))}>
                <ViewRule key={rule.id} rule={rule} onToggle={function () { return onToggle(rule); }} onDelete={function () { return onDelete(rule); }}/>
              </react_1.m.div>); })}
          </react_1.m.div>
        </react_1.LayoutGroup>
      </react_1.AnimatePresence>
    </jsx_1.Box>);
}
function ViewRule(_a) {
    var rule = _a.rule, onToggle = _a.onToggle, onDelete = _a.onDelete;
    var isInclude = rule.type === 'include';
    // const exprs = rule.include ?? rule.exclude
    return (<>
      <PredicatIcon>
        <icons_react_1.IconCirclePlus size={14}/>
      </PredicatIcon>
      <react_1.m.div layout animate={{
            originX: 0,
            scale: rule.enabled ? 1 : 0.9,
        }} className={(0, patterns_1.txt)({ flex: 1, truncate: true })}>
        {JSON.stringify(rule.expr)}
      </react_1.m.div>
      <core_2.ActionIcon onClick={function (e) {
            e.stopPropagation();
            onDelete();
        }} variant="subtle" color="red">
        <icons_react_1.IconTrash />
      </core_2.ActionIcon>
    </>);
}
function renderExpression(expr) {
    if (core_1.ModelFqnExpr.isModelRef(expr)) {
        return <ExpressionRef expr={expr}/>;
    }
    return null;
}
// function renderPredicate(predicate)
function useElementByFqnRef(ref) {
    var _a, _b;
    var fqn = core_1.FqnRef.flatten(ref);
    return (_b = (_a = (0, useLikeC4Model_1.useLikeC4Model)().findElement(fqn)) === null || _a === void 0 ? void 0 : _a.$element) !== null && _b !== void 0 ? _b : null;
}
function ExpressionRef(_a) {
    var expr = _a.expr;
    var el = useElementByFqnRef(expr.ref);
    if (!el) {
        return <div>{core_1.FqnRef.flatten(expr.ref)}</div>;
    }
    return <jsx_1.styled.div fontSize="xs">{el.title}</jsx_1.styled.div>;
}
var PredicatIcon = (0, jsx_1.styled)('div', {
    base: {
        display: 'contents',
        color: 'colorPalette.9',
    },
});
