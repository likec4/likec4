import Editor, { type EditorProps, loader } from '@monaco-editor/react'
// import type { EditorProps } from '@monaco-editor/react'

import getModelEditorServiceOverride from 'vscode/service-override/modelEditor'
import { StandaloneServices } from 'vscode/services'
import getLanguagesServiceOverride from 'vscode/service-override/languages'
// import 'monaco-editor/esm/vs/editor/editor.all'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js'
// // import 'monaco-editor/esm/vs/editor/standalone/browser/accessibilityHelp/accessibilityHelp'
// // import 'monaco-editor/esm/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard'
// // import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneHelpQuickAccess'
// // import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoLineQuickAccess'
// // import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoSymbolQuickAccess'
// // import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneCommandsQuickAccess'
// import 'monaco-editor/esm/vs/editor/standalone/browser/referenceSearch/standaloneReferenceSearch'
// // import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker'
// // import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
// // import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
// // import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
// // import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
// // import { changeCurrentDocument } from '@/data'
// import state from 'state-local'
import invariant from 'tiny-invariant'

// console.log('MonacoEnvironment', window.MonacoEnvironment)
self.MonacoEnvironment = {
  getWorker(_, _label) {
    console.log('getWorker', _label)
    // if (label === 'json') {
    //   return new jsonWorker()
    // }
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

// export function getMonaco(): typeof monaco {
//   const instance = loader.__getMonacoInstance()
//   invariant(instance, 'monaco not loaded')
//   return instance
// }

// export function getMonacoEditor() {
//   const editors = loader.__getMonacoInstance()?.editor.getEditors() ?? []
//   // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//   return editors.length > 0 ? editors[0]! : null
// }

// // const [getState, setState] = state.create({
//   services: null
// })

loader.config({ monaco })

// let overrideServices: monaco.editor.IEditorOverrideServices | undefined

export function initServies() {
  StandaloneServices.initialize(getOverrideServices())
}

export function getOverrideServices(): NonNullable<EditorProps['overrideServices']> {
  return {
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
    }),
  }
}

export {
  Editor
}

// export type {
//   BeforeMount,
//   OnMount,
//   OnChange,
//   Monaco
// }
