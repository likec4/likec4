import { documentKey, positionSnapshots, previewDiagnostics, startFrameTrace } from './viewport.ts'

const diag = previewDiagnostics()
diag.marks['scriptStart'] ??= Math.round(performance.now())

function startApp(): void {
  if (diag.started) {
    return
  }
  diag.started = true
  void import('./app.tsx').then((app) => {
    app.start()
  })
}

function onReady(): void {
  positionSnapshots(documentKey())
  diag.marks['snapshotsPositioned'] ??= Math.round(performance.now())
  startFrameTrace()

  if (document.readyState === 'complete') {
    setTimeout(startApp, 0)
    return
  }
  window.addEventListener('load', () => {
    setTimeout(startApp, 0)
  }, { once: true })
  setTimeout(startApp, 250)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onReady, { once: true })
} else {
  onReady()
}
