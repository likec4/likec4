import React from 'react'
import ReactDOM from 'react-dom/client'
import './main.css'
import DevApp from './DevApp'

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DevApp />
  </React.StrictMode>
)
