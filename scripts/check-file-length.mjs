#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const MAX_LINES = 600;
const WARNING_THRESHOLD = 450;

// Directories to ignore
const IGNORED_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.git',
  '.gemini',
  'public',
]);

// Extensions to check (manually maintained source code)
const SOURCE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.css',
  '.mjs',
  '.cjs',
]);

// Specific file exclusions (e.g. generated or lockfiles)
const EXCLUDED_FILES = new Set([
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
]);

const violations = [];
const warnings = [];
const allFiles = [];

function scanDirectory(currentDir) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    const relPath = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (SOURCE_EXTENSIONS.has(ext) && !EXCLUDED_FILES.has(entry.name)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n').length;
        allFiles.push({ path: relPath, lines });

        if (lines > MAX_LINES) {
          violations.push({ path: relPath, lines });
        } else if (lines >= WARNING_THRESHOLD) {
          warnings.push({ path: relPath, lines });
        }
      }
    }
  }
}

console.log('🔍 Checking source file line counts (Max allowed: 600 lines)...');
scanDirectory(process.cwd());

// Sort largest to smallest
allFiles.sort((a, b) => b.lines - a.lines);

console.log('\n📊 Top largest source files:');
for (const file of allFiles.slice(0, 10)) {
  const status = file.lines > MAX_LINES ? '❌ VIOLATION' : file.lines >= WARNING_THRESHOLD ? '⚠️ WARNING' : '✅ OK';
  console.log(`  ${status.padEnd(12)} ${String(file.lines).padStart(4)} lines  ${file.path}`);
}

if (warnings.length > 0) {
  console.log(`\n⚠️  ${warnings.length} file(s) approaching limit (>= ${WARNING_THRESHOLD} lines):`);
  for (const w of warnings) {
    console.log(`  - ${w.path} (${w.lines} lines)`);
  }
}

if (violations.length > 0) {
  console.error(`\n❌ ERROR: ${violations.length} source file(s) exceed the 600-line hard limit:`);
  for (const v of violations) {
    console.error(`  - ${v.path} (${v.lines} lines > ${MAX_LINES} max)`);
  }
  console.error('\nPlease decompose these files into smaller, focused modules.');
  process.exit(1);
} else {
  console.log(`\n✅ All ${allFiles.length} source files comply with the 600-line hard limit.`);
  process.exit(0);
}
