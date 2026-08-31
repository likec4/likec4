---
'likec4': patch
---

Add `likec4 publish` to upload Graphviz-layouted models to LikeC4 Cloud as a snapshot of the current commit. Publishes every project in the workspace by default, or a single one with `-p`. Repository, commit, branch and tag are read from git and from GitHub Actions environment variables, and can be overridden with `--origin`, `--sha`, `--branch` and `--tag`. Authenticate with `--token` or the `LIKEC4_PUBLISH_TOKEN` environment variable; point at another instance with `--url` or `LIKEC4_CLOUD_URL`. Validation errors block the publish unless `--force` is passed. Publishing the same commit again overwrites its snapshot, and projects accumulate into it.
