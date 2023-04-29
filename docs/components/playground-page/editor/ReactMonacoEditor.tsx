/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import 'monaco-editor/esm/vs/editor/edcore.main.js';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

import { MonacoLanguageClient, MonacoServices } from 'monaco-languageclient';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageclient/browser'
import React, { createRef, useEffect, useMemo, useRef } from 'react';
import { CloseAction, ErrorAction, MessageTransports } from 'vscode-languageclient';

import { StandaloneServices } from 'vscode/services';
// import getNotificationServiceOverride from 'vscode/service-override/notifications';
// import getDialogServiceOverride from 'vscode/service-override/dialogs';
import getModelEditorServiceOverride from 'vscode/service-override/modelEditor'

// buildWorkerDefinition('../../../node_modules/monaco-editor-workers/dist/workers/', new URL('', window.location.href).href, true);

self.MonacoEnvironment = {
  getWorker(_, _label) {
    console.log('getWorker', _label)
    if (_label === 'json') {
      return new Worker(new URL('monaco-editor/esm/vs/language/json/json.worker', import.meta.url))
    }
    // if (label === 'css' || label === 'scss' || label === 'less') {
    //   return new cssWorker()
    // }
    // if (label === 'html' || label === 'handlebars' || label === 'razor') {
    //   return new htmlWorker()
    // }
    // if (label === 'typescript' || label === 'javascript') {
    //   return new tsWorker()
    // }
    // return new EditorWorker()
    return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker', import.meta.url))
  }
}

StandaloneServices.initialize({
    // ...getNotificationServiceOverride(document.body),
    // ...getDialogServiceOverride()
    ...getModelEditorServiceOverride((_model, _options, _sideBySide) => {
      // const editor = getMonacoEditor()
      // if (!editor) {
      //   console.warn('no active editor')
      //   return Promise.resolve(undefined)
      // }
      // // const editorModel = editor.getModel() ?? null
      // // if (!editorModel || editorModel.uri.toString() !== model.uri.toString()) {
      // //   changeCurrentDocument(model.uri.toString())
      // // }
      return Promise.resolve(undefined)
    })
});

export type EditorProps = {
    defaultCode: string;
    hostname?: string;
    port?: string;
    path?: string;
    className?: string;
}

// export function createUrl(hostname: string, port: string, path: string): string {
//     const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
//     return normalizeUrl(`${protocol}://${hostname}:${port}${path}`);
// }

// function createWebSocket(url: string) {
//     const webSocket = new WebSocket(url);
//     webSocket.onopen = () => {
//         const socket = toSocket(webSocket);
//         const reader = new WebSocketMessageReader(socket);
//         const writer = new WebSocketMessageWriter(socket);
//         const languageClient = createLanguageClient({
//             reader,
//             writer
//         });
//         languageClient.start();
//         reader.onClose(() => languageClient.stop());
//     };
//     return webSocket;
// }

// function createLanguageClient(transports: MessageTransports): MonacoLanguageClient {
//     return new MonacoLanguageClient({
//         name: 'Sample Language Client',
//         clientOptions: {
//             // use a language id as a document selector
//             documentSelector: ['json'],
//             // disable the default error handler
//             errorHandler: {
//                 error: () => ({ action: ErrorAction.Continue }),
//                 closed: () => ({ action: CloseAction.DoNotRestart })
//             }
//         },
//         // create a language client connection from the JSON RPC connection on demand
//         connectionProvider: {
//             get: () => {
//                 return Promise.resolve(transports);
//             }
//         }
//     });
// }


const ReactMonacoEditor: React.FC<EditorProps> = ({
    defaultCode,
    className
}) => {
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
    const ref = createRef<HTMLDivElement>();
    // // const url = useMemo(() => createUrl(hostname, port, path), [hostname, port, path]);
    // let lspWebSocket: WebSocket;

    useEffect(() => {
        if (ref.current != null) {
            // register Monaco languages
            monaco.languages.register({
                id: 'json',
                extensions: ['.json', '.jsonc'],
                aliases: ['JSON', 'json'],
                mimetypes: ['application/json']
            });

            // create Monaco editor
            const editor = editorRef.current = monaco.editor.create(ref.current, {
                model: monaco.editor.createModel(defaultCode, 'json', monaco.Uri.parse('inmemory://model.json')),
                glyphMargin: true,
                lightbulb: {
                    enabled: true
                },
                automaticLayout: true
            });

            // install Monaco language client services
            MonacoServices.install();

            // lspWebSocket = createWebSocket(url);

            return () => {
              editor.dispose();
            };
        }

        window.onbeforeunload = () => {
            // On page reload/exit, close web socket connection
            // lspWebSocket?.close();
        };
        return () => {
            // On component unmount, close web socket connection
            // lspWebSocket?.close();
        };
    }, []);

    return (
        <div
            ref={ref}
            style={{ height: '50vh' }}
            className={className}
        />
    );
};
export default ReactMonacoEditor
