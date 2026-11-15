---
'@likec4/config': patch
'@likec4/core': patch
'@likec4/language-server': patch
'@likec4/language-services': patch
'likec4': patch
'@likec4/lsp': patch
'@likec4/mcp': patch
'likec4-vscode': patch
---

Experimental git dependencies: a project can import elements from a project in a git repository, for example `"dependencies": { "billing": { "git": "https://github.com/my-org/billing.git", "ref": "v1.2.0", "path": "architecture" } }`.

- New CLI commands `likec4 install` (alias `i`) and `likec4 update [name]` download git dependencies into the local cache (`LIKEC4_CACHE_DIR` sets its location). Other commands never download: until the dependencies are installed, `build`, `export`, `gen`, `sync leanix`, `diff`, `safe-delete` and `publish` (unless `--force`) fail, `validate` reports the error and exits with a non-zero code, `start` and `mcp` report the error in the model.
- A git dependency at the repository root can be written as a URL string: `"billing": "https://github.com/my-org/billing.git#v1.2.0"` is the same as `{ "git": "https://github.com/my-org/billing.git", "ref": "v1.2.0" }`. Strings that start with `https://` or `ssh://` are git dependencies, other strings stay local paths. Without `#ref` the dependency follows the default branch of the repository.
- The first install pins each ref to a commit, later installs reuse it until `likec4 update`. Different versions of one repository can be used side by side under different import names.
- Only `.c4` and `.likec4` files and the JSON config of the dependency are downloaded; executable configs are never run. Private repositories use your git credentials and SSH keys; requires git 2.35.2 or newer.
- VS Code: the commands "LikeC4: Install git dependencies" and "LikeC4: Update git dependencies", a quick fix to install a missing dependency, warnings about dependency files with parse errors, and read-only "Go to definition" into dependency files. Git dependencies are not supported in vscode.dev and the playground.

The format of `dependencies` may change before it becomes stable. See [Git dependencies](https://likec4.dev/config/multi-projects/#git-dependencies).
