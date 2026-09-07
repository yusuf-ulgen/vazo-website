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

// 2. Secret patterns in committed code (global)
const SECRET_REGEX_LIST = [
  { name: 'Private Key Header', regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'AWS Access Key ID', regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/ },
  { name: 'Stripe Live Secret Key', regex: /sk_live_[0-9a-zA-Z]{24}/ },
  { name: 'Google OAuth Client Secret', regex: /GOCSPX-[0-9a-zA-Z_-]{28}/ },
  { name: 'Google OAuth Refresh Token', regex: /1\/\/[0-9a-zA-Z_-]{30,}/ },
  { name: 'Supabase Service Role Key Pattern', regex: /sb_secret_[0-9a-zA-Z_-]{20,}/ },
  { name: 'Supabase Service Role Key Variable Assignment', regex: /(?:supabase_service_role|service_role_key)\s*[:=]\s*["'][A-Za-z0-9._-]{20,}["']/i },
  { name: 'PayTR Secret Key Assignment', regex: /(?:merchant_key|merchant_salt)\s*[:=]\s*["'][A-Za-z0-9]{12,}["']/i },
  { name: 'Gmail Secret Key Assignment', regex: /(?:gmail_app_password|google_app_password)\s*[:=]\s*["'][A-Za-z0-9\s]{16,}["']/i },
  { name: 'Generic Secret Token Pattern', regex: /(?:api_key|api_secret|app_secret|client_secret)\s*[:=]\s*["'][A-Za-z0-9_\-]{24,}["']/i },
];

// 3. Browser source security patterns (strictly prohibited in src/)
const SRC_SECURITY_PATTERNS = [
  { name: 'Hardcoded Browser Admin Credentials Constant', regex: /(?:EMBEDDED_ADMIN_|embedded_admin_|embeddedAdminCredentials)/i },
  { name: 'Synthetic super_admin Customer Fallback', regex: /(?:createAdminCustomerUser|ADMIN_CUSTOMER_PROFILE|isEmbeddedAdminCredentials)/i },
  { name: 'Email-Based Admin Authorization Bypass', regex: /\bisAdminEmail\s*\(/i },
  { name: 'Hardcoded Browser Admin Password Object', regex: /(?:admin_credentials|adminCredentials)\s*[:=]\s*\{/i },
];

const IGNORED_SCAN_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  'playwright-report',
  'test-results',
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
      // Skip scanning safety scanner script itself for pattern literals
      if (relPath === 'scripts/check-repository-safety.mjs') {
        continue;
      }

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

        // Additional browser-only security checks
        if (relPath.startsWith('src/')) {
          for (const { name, regex } of SRC_SECURITY_PATTERNS) {
            if (regex.test(content)) {
              console.error(`❌ BROWSER SECURITY VIOLATION [${name}] in file: ${relPath}`);
              hasErrors = true;
            }
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
