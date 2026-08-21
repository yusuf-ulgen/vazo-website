import fs from 'node:fs';
import path from 'node:path';

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
];

const missing = requiredChecks.filter((check) => !content.includes(check));

if (missing.length > 0) {
  console.error(`❌ Error: Database security test suite is missing required assertions: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('✅ Database security test suite (pgTAP) validated successfully.');
process.exit(0);
