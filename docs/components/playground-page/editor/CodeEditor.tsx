// import { Editor } from './monaco'
import { Editor, initServies } from './monaco'
import type { BeforeMount, Monaco } from '@monaco-editor/react'
import { useCallback } from 'react'
import { getOverrideServices } from './monaco'
import { startLanguageClient } from './language-client/languageClient'
// import type { BeforeMount, OnMount, OnChange, Monaco } from '@monaco-editor/react'
// import { toPairs } from 'rambdax'
// import { locateElement, locateRelation, locateView, startLanguageServer } from './language-client/languageClient'
// import { useCallback, useState } from 'react'
// import { useUnmountEffect } from '@react-hookz/web/esm'


// function loadDocuments(monaco: Monaco) {
//   const files = useDocumentsStore.getState().files
//   for (const [filename, value] of toPairs(files)) {
//     const uri = monaco.Uri.parse(filename)
//     const model = monaco.editor.getModel(uri)
//     if (!model) {
//       monaco.editor.createModel(value, 'c4x', uri)
//     } else {
//       model.setValue(value)
//     }
//   }
// }

function setupMonaco(monaco: Monaco) {
  monaco.editor.defineTheme('myCustomTheme', {
    base: 'vs-dark',
    inherit: true,
    colors: {
      'editor.background': '#FFFFFF00',
    },
    rules: []
  })
  monaco.languages.register({
    id: 'likec4',
    extensions: ['.c4'],
    aliases: ['Like C4'],
    mimetypes: ['text/plain'],
  })
  initServies()
  // MonacoServices.install()
}

//   // do something before editor is mounted

//   monaco.languages.setLanguageConfiguration('c4x', {
//     comments: {
//       lineComment: '//',
//       blockComment: ['/*', '*/']
//     },
//     brackets: [
//       ['{', '}']
//     ],
//     autoClosingPairs: [
//       {
//         'open': '{',
//         'close': '}'
//       },
//       {
//         'open': '\'',
//         'close': '\'',
//         'notIn': [
//           'string',
//           'comment'
//         ]
//       },
//       {
//         'open': '"',
//         'close': '"',
//         'notIn': [
//           'string'
//         ]
//       },
//       {
//         'open': '/*',
//         'close': ' */',
//         'notIn': [
//           'string'
//         ]
//       }
//     ],
//     surroundingPairs: [
//       {
//         open: '{',
//         close: '}'
//       },
//     ],
//     // colorizedBracketPairs: [
//     //   ['{','}'],
//     // ]
//   })

//   monaco.editor.defineTheme('myCustomTheme', {
//     base: 'vs-dark',
//     inherit: true,
//     colors: {
//       'editor.background': '#FFFFFF00',
//     },
//     rules: []
//   })

//   monaco.editor.registerCommand('c4x.open-preview', (_, viewID?: ViewID) => {
//     if (viewID) {
//       switchActiveView(viewID)
//     }
//   })

//   // MonacoServices.install()

// })

export default function CodeEditor() {
  // const currentFile = useDocumentsStore(s => s.current)
  // const [isReady, setReady] = useState(false)

  const handleBeforeMount = useCallback((monaco: Monaco) => {
    setupMonaco(monaco)
    startLanguageClient(monaco)
  }, [])

  // const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
  //   editor.updateOptions({
  //     theme: 'myCustomTheme',
  //   })
  //   void startLanguageServer(monaco)
  //   useModelStore.setState({
  //     goToSource: (opts) => {
  //       if ('node' in opts) {
  //         void locateElement(opts.node.id)
  //       }
  //       if ('relationId' in opts) {
  //         void locateRelation(opts.relationId)
  //       }
  //       if ('viewId' in opts) {
  //         void locateView(opts.viewId)
  //       }
  //     }
  //   })
  // }, [])

  // useUnmountEffect(() => {
  //   useModelStore.setState({goToSource: null})
  // })

  // const onChange: OnChange = useCallback((value, _ev) => {
  //   if (value) {
  //     updateDocument(currentFile, value)
  //   }
  // }, [currentFile])

  return <Editor
    options={{
      extraEditorClassName: 'likec4-editor',
      minimap: {
        enabled: false
      },
      scrollbar: {
        vertical: 'hidden',
      },
      guides: {
        indentation: false,
        bracketPairs: false,
        bracketPairsHorizontal: 'active'
        // bracketPairs: 'active',

        // highlightActiveIndentation: false
      },
      fontFamily: '"Fira Code"',
      fontSize: 14,
      lineHeight: 22,
      renderLineHighlightOnlyWhenFocus: true,
      foldingHighlight: false,
      overviewRulerBorder: false,
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      'semanticHighlighting.enabled': true,
    }}
    theme={'myCustomTheme'}
    // overrideServices={getOverrideServices()}
    // {...(isReady ? {
    //   theme: 'myCustomTheme',
    //   path: currentFile,
    //   onChange
    // } : {
    //   defaultValue: '',
    // })}
    defaultValue={''}
    defaultLanguage={'likec4'}
    beforeMount={handleBeforeMount}
    // onMount={handleEditorDidMount}
    onValidate={markers =>
      console.log('onValidate', { markers })
    }
  />
}
