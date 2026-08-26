import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const args = process.argv.slice(2);
const isLiveMode = args.includes('--live');
const isStaticOnly = args.includes('--static') || !isLiveMode;

// 1. UUID Migration & Test Preflight Scanner
// ------------------------------------------------------------------------------
console.log('🔍 Running Database UUID Migration & Test Preflight Scanner...');
const supabaseDir = path.resolve(process.cwd(), 'supabase');
let invalidUuidCount = 0;

function scanSqlFilesForUuids(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanSqlFilesForUuids(fullPath);
    } else if (entry.name.endsWith('.sql')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const uuidRegex = /'([0-9a-zA-Z]{8}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{12})'/g;
      let match;
      while ((match = uuidRegex.exec(content)) !== null) {
        const candidate = match[1];
        const isValidHexUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(candidate);
        if (!isValidHexUuid) {
          console.error(`❌ Invalid UUID literal found in ${path.relative(process.cwd(), fullPath)}: "${candidate}"`);
          invalidUuidCount++;
        }
      }
    }
  }
}

scanSqlFilesForUuids(supabaseDir);

if (invalidUuidCount > 0) {
  console.error(`❌ UUID Preflight FAILED: Found ${invalidUuidCount} invalid UUID literal(s) with non-hex characters.`);
  process.exit(1);
}
console.log('✅ UUID Preflight PASSED: All SQL migration and test literals conform to PostgreSQL UUID syntax [0-9a-fA-F-].');

// 2. pgTAP Security Test Plan & Assertion Validation
// ------------------------------------------------------------------------------
const sqlTestPath = path.resolve(process.cwd(), 'supabase/tests/database_security.sql');

if (!fs.existsSync(sqlTestPath)) {
  console.error('❌ Error: supabase/tests/database_security.sql not found.');
  process.exit(1);
}

const content = fs.readFileSync(sqlTestPath, 'utf-8');

const requiredChecks = [
  'row_level_security_is_active',
  'SET LOCAL ROLE anon',
  'products',
  'trade_applications',
  'contact_messages',
  'newsletter_subscriptions',
  'site_settings',
  'admin_audit_logs',
  'Direct anonymous INSERT into trade_applications must fail',
  'Direct anonymous INSERT into contact_messages must fail',
  'Direct anonymous INSERT into newsletter_subscriptions must fail',
  'Child variant of draft product is completely invisible to anonymous visitors',
  'Child media of draft product is completely invisible to anonymous visitors',
  'Audit logs are immutable: UPDATE must fail with 27000',
  'Audit logs are immutable: DELETE must fail with 27000',
  'Product primary media uniqueness',
  'set_primary_product_media',
  'Storage bucket public-media file size limit',
  'SELECT * FROM finish()',
  'ROLLBACK',
];

const missing = requiredChecks.filter((check) => !content.includes(check));

if (missing.length > 0) {
  console.error(`❌ Error: Database security test suite is missing required assertions: ${missing.join(', ')}`);
  process.exit(1);
}

// Check plan count matches test items
const planMatch = content.match(/plan\((\d+)\)/);
if (!planMatch) {
  console.error('❌ Error: pgTAP plan(...) not declared in database_security.sql');
  process.exit(1);
}

const plannedCount = parseInt(planMatch[1], 10);
const selectAssertions = (content.match(/SELECT\s+(has_table|row_level_security_is_active|ok|is|throws_ok|lives_ok)/g) || []).length;

if (plannedCount !== selectAssertions) {
  console.error(`❌ Error: pgTAP plan(${plannedCount}) does not match assertion count (${selectAssertions}).`);
  process.exit(1);
}

console.log(`✅ Static DB test suite validation passed: ${plannedCount} planned pgTAP assertions verified in SQL file.`);

// 3. Live Mode Execution
// ------------------------------------------------------------------------------
if (isLiveMode || process.env.CI_SUPABASE_TEST === 'true' || process.env.DATABASE_URL) {
  try {
    console.log('Running live pgTAP test suite against PostgreSQL runner via "supabase test db"...');
    execSync('supabase test db', { stdio: 'inherit' });
    console.log(`✅ Live pgTAP database security test suite (${plannedCount} assertions) PASSED.`);
  } catch (err) {
    console.error('❌ Error executing live pgTAP suite ("supabase test db"):', err);
    process.exit(1);
  }
} else if (isStaticOnly) {
  console.log('ℹ️  Note: Static validation only. To execute live against PostgreSQL, run "npm run test:db:live" with active Supabase.');
}

process.exit(0);
