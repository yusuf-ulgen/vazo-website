#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

console.log('🔒 Checking repository safety, secret leaks, and sensitive files...');

let hasErrors = false;

// 1. Prohibited sensitive files in workspace root or subdirectories
const SENSITIVE_FILE_PATTERNS = [
  /^\.env$/,
  /^\.env\.local$/,
  /^\.env\..*\.local$/,
  /.*\.pem$/,
  /.*\.key$/,
  /.*id_rsa.*/,
];

// 2. Secret patterns in committed code
const SECRET_REGEX_LIST = [
  { name: 'Private Key Header', regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'AWS Access Key ID', regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/ },
  { name: 'Stripe Live Secret Key', regex: /sk_live_[0-9a-zA-Z]{24}/ },
  { name: 'Generic Secret Token Pattern', regex: /(?:api_key|api_secret|app_secret|client_secret)\s*[:=]\s*["'][A-Za-z0-9_\-]{24,}["']/i },
];

const IGNORED_SCAN_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.git',
  '.gemini',
]);

function scanDirectory(currentDir) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    const relPath = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (!IGNORED_SCAN_DIRS.has(entry.name)) {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      // Check prohibited filename patterns
      for (const pattern of SENSITIVE_FILE_PATTERNS) {
        if (pattern.test(entry.name)) {
          console.error(`❌ PROHIBITED SENSITIVE FILE DETECTED: ${relPath}`);
          hasErrors = true;
        }
      }

      // Check file content for secret patterns (skip binary/huge files)
      if (!entry.name.endsWith('.png') && !entry.name.endsWith('.jpg') && !entry.name.endsWith('.svg') && !entry.name.endsWith('.lock')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        for (const { name, regex } of SECRET_REGEX_LIST) {
          if (regex.test(content)) {
            console.error(`❌ SENSITIVE PATTERN DETECTED [${name}] in file: ${relPath}`);
            hasErrors = true;
          }
        }
      }
    }
  }
}

scanDirectory(process.cwd());

if (hasErrors) {
  console.error('\n❌ Repository safety check FAILED. Remove sensitive files/secrets before proceeding.');
  process.exit(1);
} else {
  console.log('✅ Repository safety check PASSED. No prohibited files or exposed secret patterns detected.');
  process.exit(0);
}
