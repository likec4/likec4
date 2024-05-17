// dprint-ignore
import './font-ibm-plex-sans.css'
import './font-fira-code.css'
import '@mantine/core/styles.css'
import '@xyflow/react/dist/style.css'
import './main.css'

import { configureMonacoWorkers } from '#monaco/bootstrap'
import ReactDOM from 'react-dom/client'
import { Routes } from './router'
// import { configureMonacoWorkers } from './config/wrapperConfig'

configureMonacoWorkers()

ReactDOM.createRoot(document.getElementById('like4-root')!).render(
  <Routes />
)

// // const worker = createLikeC4Worker();

// const userCconfig = createMonacoConfig({
//   // worker
// });

// const htmlElement = document.getElementById('like4-root') as HTMLElement;
// const comp = <MonacoEditorReactComp
//     userConfig={userCconfig}
//     style={{
//         'paddingTop': '5px',
//         'height': '80vh'
//     }}
// />;
// ReactDOM.createRoot(htmlElement!).render(comp);
