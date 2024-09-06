import { startLanguageServer as startLanguim } from 'langium/lsp'
import { BrowserMessageReader, BrowserMessageWriter, createConnection } from 'vscode-languageserver/browser'
import { createLanguageServices } from './module'

// This is an example copied as is from here:
// https://github.com/microsoft/vscode-extension-samples/blob/main/lsp-web-extension-sample/server/src/browserServerMain.ts
// the only addition is the following line:
declare const self: DedicatedWorkerGlobalScope

export function startLanguageServer() {
  /* browser specific setup code */

  const messageReader = new BrowserMessageReader(self)
  const messageWriter = new BrowserMessageWriter(self)

  const connection = createConnection(messageReader, messageWriter)

  // Inject the shared services and language-specific services
  const services = createLanguageServices({ connection })

  // Start the language server with the shared services
  startLanguim(services.shared)

  return {
    ...services,
    connection,
    messageReader,
    messageWriter
  }
}
