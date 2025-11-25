# Beginner Nontes

## For the required version of nodejs and pnpm, dprint

- Install asdf and use it, which will follow the ./.tool-versions satisfying the version requirements
- Note, the already installed version of nodejs (node) in Ubuntu might not be the expected
  version, as there is no new install, asdf might not have the chance to enforce
  the nodejs' version. 
  If that is the case, you should manually install the correct version and use it.

## pnpm build failure of "FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory"

Try 
```
NODE_OPTIONS="--max-old-space-size=4096" pnpm build
```
 
I had the error in Ubuntu/WSL 2, the solution worked.

To make it the setting permanent, add the following to ~/.bashrc

```
shell
# Avodi pnmp build failure:
export NODE_OPTIONS="--max-old-space-size=4096"
# end of Avodi pnmp build failure
```

## dprint installation

Install locally,

```
npm install dprint
```

this would have the error in VS Code and its derivations.

The local dprint has to be used via:

```
npx dprint
```

To install globally would not have the issue:

```
npm install -g dprint
```

Local installation is preferred or required for the version per the project.
(I have running any, to tell if the local installation would have any problem. Fri Nov 21 08:08:49 2025)
