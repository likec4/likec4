"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMessage = ErrorMessage;
exports.ViewNotFound = ViewNotFound;
function ErrorMessage(_a) {
    var children = _a.children;
    return (<div style={{
            margin: '1em 0',
        }}>
      <div style={{
            margin: '0 auto',
            display: 'inline-block',
            padding: '2em',
            background: 'rgba(250,82,82,.15)',
            color: '#ffa8a8',
        }}>
        {children}
      </div>
    </div>);
}
function ViewNotFound(_a) {
    var viewId = _a.viewId;
    return (<ErrorMessage>
      View <code>{viewId}</code> not found
    </ErrorMessage>);
}
