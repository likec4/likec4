"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompoundTitle = CompoundTitle;
var IconRenderer_1 = require("../../context/IconRenderer");
function CompoundTitle(_a) {
    var data = _a.data;
    var elementIcon = (0, IconRenderer_1.IconRenderer)({
        element: data,
        className: 'likec4-compound-icon',
    });
    return (<div className={'likec4-compound-title-container'}>
      {elementIcon}
      <div className={'likec4-compound-title'}>
        {data.title}
      </div>
    </div>);
}
