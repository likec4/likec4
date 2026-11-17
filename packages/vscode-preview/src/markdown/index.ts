let started = false

function startApp(): void {
  if (started) {
    return
  }
  started = true
  void import('./app.tsx').then((app) => {
    app.start()
  })
}

function onReady(): void {
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
