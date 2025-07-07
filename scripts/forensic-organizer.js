#!/usr/bin/env node
/**
 * Forensic Case Organizer
 * Sorts and renames evidence files into case folders.
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { program } from 'commander'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function parseFilename(name) {
  const regex = /case(\d+)_([a-zA-Z]+)_(\d{8})/i
  const match = name.match(regex)
  if (!match) return null
  const [, caseId, type, date] = match
  return { caseId, type, date }
}

function sanitize(value) {
  return value.replace(/[^a-z0-9_-]/gi, '_')
}

function organize({ source, dest, dryRun }) {
  if (!fs.existsSync(source)) {
    console.error(`Source directory not found: ${source}`)
    process.exit(1)
  }

  for (const file of fs.readdirSync(source)) {
    const srcPath = path.join(source, file)
    if (fs.statSync(srcPath).isDirectory()) continue

    const meta = parseFilename(file) || {
      caseId: 'unknown',
      type: 'misc',
      date: '00000000'
    }

    const caseDir = path.join(dest, sanitize(`case-${meta.caseId}`))
    const ext = path.extname(file)
    const basename = path.basename(file, ext)
    const hash = crypto
      .createHash('md5')
      .update(basename)
      .digest('hex')
      .slice(0, 8)
    const newName = `${sanitize(meta.caseId)}_${sanitize(meta.type)}_${meta.date}_${hash}${ext}`
    const destPath = path.join(caseDir, newName)

    if (dryRun) {
      console.log(`[DRY RUN] ${srcPath} -> ${destPath}`)
      continue
    }

    fs.mkdirSync(caseDir, { recursive: true })
    fs.copyFileSync(srcPath, destPath)
    console.log(`Moved ${srcPath} -> ${destPath}`)
  }
}

program
  .requiredOption('--source <path>', 'source directory with raw files')
  .requiredOption('--dest <path>', 'destination directory for organized files')
  .option('--dry-run', 'show operations without copying')

program.parse()

organize(program.opts())
