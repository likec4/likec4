"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnsureMantine = EnsureMantine;
var core_1 = require("@mantine/core");
var react_1 = require("react");
var DefaultMantineProvider_1 = require("./DefaultMantineProvider");
function EnsureMantine(_a) {
    var children = _a.children;
    var mantineCtx = (0, react_1.useContext)(core_1.MantineContext);
    (0, react_1.useEffect)(function () {
        if (!mantineCtx) {
            console.warn('LikeC4Diagram must be a child of MantineProvider');
        }
    }, []);
    if (!mantineCtx) {
        return (<DefaultMantineProvider_1.DefaultMantineProvider>
        {children}
      </DefaultMantineProvider_1.DefaultMantineProvider>);
    }
    return <>{children}</>;
}
