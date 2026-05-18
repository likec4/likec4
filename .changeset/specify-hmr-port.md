---
'likec4': patch
---

Add `--hmr-port` option to the `start` CLI command for specifying the HMR WebSocket port.

The port can also be set via the `HMR_PORT` environment variable. If neither is provided, a free port is auto-discovered in the range 24678–24690.
