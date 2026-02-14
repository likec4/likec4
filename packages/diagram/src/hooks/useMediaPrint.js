"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMediaPrint = useMediaPrint;
var media_query_1 = require("@nanostores/media-query");
var react_1 = require("@nanostores/react");
var $isPrint = /* @__PURE__ */ (0, media_query_1.fromMediaQuery)('print');
/**
 * Hook to determine if the current media is print.
 */
function useMediaPrint() {
    return (0, react_1.useStore)($isPrint);
}
