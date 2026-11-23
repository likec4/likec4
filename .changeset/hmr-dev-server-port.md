---
'likec4': patch
---

`likec4 start` now serves HMR over the dev server port unless `--hmr-port`, `HMR_PORT` or `server.hmrPort` is set. In Docker you only need to publish `5173`, and live updates also work behind a reverse proxy or a forwarded port. Before, the HMR WebSocket ran on a separate port from the 24678-24690 range, and if that port wasn't published, live updates stopped without any error on the page.
