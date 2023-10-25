#!/usr/bin/env node
import fs from 'node:fs'
import { mkdir } from 'fs/promises'
import { $ } from 'execa'
import { fileURLToPath } from 'node:url'
import { resolve } from 'path'
import path from 'node:path'
import prompts from 'prompts'

function copy(src: string, dest: string) {
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    copyDir(src, dest)
  } else {
    fs.copyFileSync(src, dest)
  }
}

function copyDir(srcDir: string, destDir: string) {
  fs.mkdirSync(destDir, { recursive: true })
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file)
    const destFile = path.resolve(destDir, file)
    copy(srcFile, destFile)
  }
}

function pkgFromUserAgent(userAgent: string | undefined) {
  if (!userAgent) return undefined
  const pkgSpec = userAgent.split(' ')[0]
  if (!pkgSpec) return undefined
  const pkgSpecArr = pkgSpec.split('/')
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1]
  }
}

async function init() {
  const cwd = process.cwd()

  const pkgInfo = pkgFromUserAgent(process.env['npm_config_user_agent'])
  const pkgManager = pkgInfo ? pkgInfo.name : 'npm'

  const results = await prompts({
    type: 'text',
    name: 'targetDir',
    initial: '.',
    message: 'Directory to create project in:'
  })
  const root = resolve(cwd, results.targetDir)

  await mkdir(root, { recursive: true })

  // let targetDir = 'likec4'

  console.log(`Creating project in ${root}...`)

  const templateDir = resolve(fileURLToPath(import.meta.url), '../../template')

  const write = (file: string, content?: string) => {
    const targetPath = path.join(root, file)
    if (content) {
      fs.writeFileSync(targetPath, content)
    } else {
      copy(path.join(templateDir, file), targetPath)
    }
  }

  const files = fs.readdirSync(templateDir)
  for (const file of files) {
    write(file)
  }

  console.log(`\nDone\nInstalling dependencies...`)

  const $$ = $({
    cwd: root,
    stderr: 'inherit',
    stdout: 'inherit'
  })
  switch (pkgManager) {
    case 'yarn': {
      await $$`yarn`
      console.log(`\nDone\nRunning dev server...`)
      await $$`yarn dev`
      break
    }
    default: {
      await $$`npm install`
      console.log(`\nDone\nRunning dev server...`)
      await $$`npm run dev`
      break
    }
  }
}

await init()
