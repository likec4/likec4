import { existsSync } from 'node:fs'
import { cp, rm } from 'node:fs/promises'

if (existsSync('package.json.backup')) {
  await cp('package.json.backup', 'package.json', { force: true })
  await rm('package.json.backup')
  console.log('Restored package.json from backup')
} else {
  console.log('No backup found, skipping restore')
}
