/* eslint-disable @typescript-eslint/ban-ts-comment */
import { startLanguageServer, EmptyFileSystem } from 'langium'
import {
  createConnection,
  BrowserMessageReader,
  BrowserMessageWriter
} from 'vscode-languageserver/browser'
import { createLanguageServices } from '@likec4/language-server'

// This is an example copied as is from here:
// https://github.com/microsoft/vscode-extension-samples/blob/main/lsp-web-extension-sample/server/src/browserServerMain.ts
// the only addition is the following line:
declare const self: DedicatedWorkerGlobalScope

/* browser specific setup code */

const messageReader = new BrowserMessageReader(self)
const messageWriter = new BrowserMessageWriter(self)

const connection = createConnection(messageReader, messageWriter)

// Inject the shared services and language-specific services
const { shared } = createLanguageServices({
  connection,
  ...EmptyFileSystem
})

// Start the language server with the shared services
startLanguageServer(shared)
