// This is an example copied as is from here:
// https://github.com/microsoft/vscode-extension-samples/blob/main/lsp-web-extension-sample/server/src/browserServerMain.ts

import { startLanguageServer } from './browser'

// the only addition is the following line:
declare const self: DedicatedWorkerGlobalScope

startLanguageServer(self)
