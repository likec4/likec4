"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FramerMotionConfig = exports.ShadowRoot = exports.PortalToContainer = exports.Overlay = exports.useEnabledFeatures = exports.IfReadOnly = exports.IfNotReadOnly = exports.IfNotEnabled = exports.IfEnabled = exports.Base = void 0;
__exportStar(require("./builtins"), exports);
__exportStar(require("./customNodes"), exports);
__exportStar(require("./hooks"), exports);
__exportStar(require("./primitives"), exports);
var Base_1 = require("../base/Base");
Object.defineProperty(exports, "Base", { enumerable: true, get: function () { return Base_1.Base; } });
var DiagramFeatures_1 = require("../context/DiagramFeatures");
Object.defineProperty(exports, "IfEnabled", { enumerable: true, get: function () { return DiagramFeatures_1.IfEnabled; } });
Object.defineProperty(exports, "IfNotEnabled", { enumerable: true, get: function () { return DiagramFeatures_1.IfNotEnabled; } });
Object.defineProperty(exports, "IfNotReadOnly", { enumerable: true, get: function () { return DiagramFeatures_1.IfNotReadOnly; } });
Object.defineProperty(exports, "IfReadOnly", { enumerable: true, get: function () { return DiagramFeatures_1.IfReadOnly; } });
Object.defineProperty(exports, "useEnabledFeatures", { enumerable: true, get: function () { return DiagramFeatures_1.useEnabledFeatures; } });
var Overlay_1 = require("../overlays/overlay/Overlay");
Object.defineProperty(exports, "Overlay", { enumerable: true, get: function () { return Overlay_1.Overlay; } });
var PortalToContainer_1 = require("../components/PortalToContainer");
Object.defineProperty(exports, "PortalToContainer", { enumerable: true, get: function () { return PortalToContainer_1.PortalToContainer; } });
var ShadowRoot_1 = require("../shadowroot/ShadowRoot");
Object.defineProperty(exports, "ShadowRoot", { enumerable: true, get: function () { return ShadowRoot_1.ShadowRoot; } });
var FramerMotionConfig_1 = require("../context/FramerMotionConfig");
Object.defineProperty(exports, "FramerMotionConfig", { enumerable: true, get: function () { return FramerMotionConfig_1.FramerMotionConfig; } });
