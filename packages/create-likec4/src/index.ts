#!/usr/bin/env node
import { $ } from 'execa'
import { mkdir } from 'fs/promises'
import fs from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
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
    const srcFile = resolve(srcDir, file)
    const destFile = resolve(destDir, file)
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
  const pkgManager = pkgInfo?.name ?? 'npm'

  const results = await prompts({
    type: 'text',
    name: 'targetDir',
    initial: 'likec4',
    message: 'Directory to create project in:'
  })
  const root = resolve(cwd, results.targetDir)

  await mkdir(root, { recursive: true })

  console.log(`Creating project in ${root}...`)

  const templateDir = resolve(fileURLToPath(import.meta.url), '../../template')

  const write = (file: string, content?: string) => {
    const targetPath = join(root, file)
    if (content) {
      fs.writeFileSync(targetPath, content)
    } else {
      copy(join(templateDir, file), targetPath)
    }
  }

  const files = fs.readdirSync(templateDir)
  for (const file of files) {
    write(file)
  }

  console.log(`\nDone\nInstalling dependencies...\n`)

  const $$ = $({
    cwd: root,
    stderr: 'inherit',
    stdout: 'inherit'
  })
  await $$`${pkgManager} install`
  console.log(`\nDone\nRunning dev server...\n`)
  await $$`${pkgManager} start`
}

await init()
