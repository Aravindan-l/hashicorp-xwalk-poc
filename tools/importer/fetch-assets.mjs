#!/usr/bin/env node
/* eslint-disable no-restricted-syntax, no-console -- CLI: sequential downloads, progress */
/*
 * Downloads the images an import mapped to DAM paths (the `assets` map in each
 * tools/importer/reports/**\/*.report.json) into the workspace copy of the DAM:
 * content/content/dam/... Run after run-bulk-import.js, from the project root:
 *
 *   node tools/importer/fetch-assets.mjs [report.json ...]
 *
 * Only writes into a page's own subfolder of content/content/dam/hashicorp-xwalk-poc/
 * (never the folder root) and never overwrites an existing file, so other pages' assets
 * cannot be replaced.
 */
import {
  existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const ALLOWED_PREFIX = '/content/dam/hashicorp-xwalk-poc/';
const REPORTS_DIR = 'tools/importer/reports';

function findReports(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return findReports(path);
    return name.endsWith('.report.json') ? [path] : [];
  });
}

async function download(damPath, source) {
  const inSubfolder = damPath.slice(ALLOWED_PREFIX.length).includes('/');
  if (!damPath.startsWith(ALLOWED_PREFIX) || !inSubfolder || damPath.includes('..')) {
    throw new Error(`refusing to write outside a subfolder of ${ALLOWED_PREFIX}: ${damPath}`);
  }
  const target = resolve('content', `.${damPath}`);
  if (existsSync(target)) return 'exists';
  const response = await fetch(source);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${source}`);
  const type = response.headers.get('content-type') || '';
  if (!type.startsWith('image/')) throw new Error(`not an image (${type}) for ${source}`);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, Buffer.from(await response.arrayBuffer()));
  return 'downloaded';
}

const reports = process.argv.slice(2).length ? process.argv.slice(2) : findReports(REPORTS_DIR);
let failed = 0;
for (const report of reports) {
  const { assets = {} } = JSON.parse(readFileSync(report, 'utf8'));
  for (const [damPath, source] of Object.entries(assets)) {
    try {
      // eslint-disable-next-line no-await-in-loop
      console.log(`${await download(damPath, source)}  ${damPath}`);
    } catch (e) {
      failed += 1;
      console.error(`failed      ${damPath}: ${e.message}`);
    }
  }
}
process.exitCode = failed ? 1 : 0;
