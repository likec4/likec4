"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LikeC4ModelProvider = LikeC4ModelProvider;
var LikeC4ModelContext_1 = require("./context/LikeC4ModelContext");
/**
 * Ensures LikeC4Model context
 */
function LikeC4ModelProvider(_a) {
    var children = _a.children, likec4model = _a.likec4model;
    return (<LikeC4ModelContext_1.LikeC4ModelContextProvider value={likec4model}>
      {children}
    </LikeC4ModelContext_1.LikeC4ModelContextProvider>);
}
