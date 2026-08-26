import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const args = process.argv.slice(2);
const isLiveMode = args.includes('--live');
const isStaticOnly = args.includes('--static') || !isLiveMode;

const sqlTestPath = path.resolve(process.cwd(), 'supabase/tests/database_security.sql');

if (!fs.existsSync(sqlTestPath)) {
  console.error('❌ Error: supabase/tests/database_security.sql not found.');
  process.exit(1);
}

const content = fs.readFileSync(sqlTestPath, 'utf-8');

// Required security invariants that must be verified in the SQL test suite
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

// If live mode requested or active database test environment present
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
