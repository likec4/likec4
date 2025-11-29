# Beginner Nontes

## Introduction

These are the notes for beginners to the project, or Javascript/Typescript eco-system. 
(They can be ignored for the experienced and knowledgeable.)

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

this would have the error in VS Code and its derivations that dprint is not accessible.

The local dprint has to be accessed via (which VS Code, etc. would not assumed so):

```
npx dprint
```

To install globally would not have the issue:

```
npm install -g dprint
```

It seems that the local installation does not have any problem with the
project's setup, as I have not seen any error when running the tasks in the project.

## To propagate any update in the project to the VS Code extension and try with the modified extension in VS Code

Here are the steps:
1. Execute at the project root,
```
pnpm turbo run build --filter='@likec4/vscode-preview' --filter='likec4-vscode'`
```
2. In a VS Code session, in "Run and Debug view", select "Run Extension" and run it

Then in the newly spawn VS Code session,
the local extension with the modifications will be in effect.

## Running VS Code with the local modified extension in Ubluntu/WSL2 might block
the Ubluntu/WSL2's operation 

I found a git commit Ubluntu/WSL2 was too slow to complete when 
Running VS Code with the local modified extension in the Ubluntu/WSL2
