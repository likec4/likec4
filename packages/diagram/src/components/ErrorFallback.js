"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorFallback = ErrorFallback;
exports.ErrorBoundary = ErrorBoundary;
var css_1 = require("@likec4/styles/css");
var jsx_1 = require("@likec4/styles/jsx");
var core_1 = require("@mantine/core");
var icons_react_1 = require("@tabler/icons-react");
var react_1 = require("react");
var react_error_boundary_1 = require("react-error-boundary");
function ErrorFallback(_a) {
    var error = _a.error, resetErrorBoundary = _a.resetErrorBoundary;
    var errorString = error instanceof Error ? error.message : 'Unknown error';
    var dialogRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(function () {
        var _a;
        (_a = dialogRef.current) === null || _a === void 0 ? void 0 : _a.showModal();
    }, []);
    return (<dialog ref={dialogRef} className={(0, css_1.css)({
            margin: '0',
            padding: '0',
            position: 'fixed',
            top: '10',
            left: '10',
            width: '[calc(100vw - ({spacing.10} * 2))]',
            height: 'max-content',
            maxHeight: '[calc(100vh - ({spacing.10} * 3))]',
            background: "likec4.overlay.body",
            rounded: 'sm',
            borderWidth: 3,
            borderColor: "likec4.overlay.border",
            shadow: 'xl',
            outline: 'none',
            _backdrop: {
                cursor: 'zoom-out',
                backdropFilter: "blur(18px)",
                bg: '[color-mix(in oklab, {colors.likec4.overlay.backdrop} 60%, transparent)]',
            },
        })} onClick={function (e) {
            var _a, _b, _c;
            e.stopPropagation();
            if (((_b = (_a = e.target) === null || _a === void 0 ? void 0 : _a.nodeName) === null || _b === void 0 ? void 0 : _b.toUpperCase()) === 'DIALOG') {
                (_c = dialogRef.current) === null || _c === void 0 ? void 0 : _c.close();
                return;
            }
        }} onClose={function (e) {
            e.stopPropagation();
            resetErrorBoundary();
        }}>
      <jsx_1.HStack p={'xl'} gap={'lg'} alignItems={'flex-start'} flexWrap={'nowrap'}>
        <core_1.ThemeIcon size={'md'} radius={'xl'} color="red">
          <icons_react_1.IconX style={{ width: 20, height: 20 }}/>
        </core_1.ThemeIcon>
        <jsx_1.VStack flex={'1'}>
          <core_1.Text fz={'md'}>
            Oops, something went wrong
          </core_1.Text>
          <core_1.ScrollAreaAutosize maw={'100%'} mah={400} type="auto">
            <core_1.Text fz={'md'} c={'red'} style={{ whiteSpace: 'pre-wrap', userSelect: 'all' }}>
              {errorString}
            </core_1.Text>
          </core_1.ScrollAreaAutosize>
          <jsx_1.HStack gap={'md'} mt="md">
            <core_1.Button size="sm" variant="default" onClick={function () { return resetErrorBoundary(); }}>Reset</core_1.Button>
            <core_1.Text fz={'sm'} c={'dimmed'}>
              See console for more details and report the issue if it persists.
            </core_1.Text>
          </jsx_1.HStack>
        </jsx_1.VStack>
      </jsx_1.HStack>
    </dialog>);
}
function ErrorBoundary(props) {
    return (<react_error_boundary_1.ErrorBoundary FallbackComponent={ErrorFallback} onError={function (err, info) {
            console.error(err, info);
        }} {...props}/>);
}
