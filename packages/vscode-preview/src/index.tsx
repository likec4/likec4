import {
  provideVSCodeDesignSystem,
  vsCodeButton,
  vsCodeProgressRing
} from '@vscode/webview-ui-toolkit'
import ReactDOM from 'react-dom/client'
import App from './App'

// In order to use the Webview UI Toolkit web components they
// must be registered with the browser (i.e. webview) using the
// syntax below.
provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeProgressRing())

// Just like a regular webpage we need to wait for the webview
// DOM to load before we can reference any of the HTML elements
// or toolkit components
window.addEventListener('load', main)

function main() {
  const root = document.getElementById('root') as HTMLDivElement
  root.innerHTML = ''

  // const reactRoot = ReactDOM.createRoot(root)
  ReactDOM.createRoot(root).render(<App />)
}
