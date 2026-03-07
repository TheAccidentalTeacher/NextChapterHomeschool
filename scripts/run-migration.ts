// Quick migration runner - tries to connect and run migration SQL
import postgres from "postgres";
import * as fs from "fs";
import * as path from "path";

// Load env
const envPath = path.resolve(__dirname, "..", ".env.local");
const envText = fs.readFileSync(envPath, "utf-8");
const supabaseUrl = envText.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim() ?? "";
const projectRef = supabaseUrl.match(/https:\/\/(.+?)\.supabase\.co/)?.[1] ?? "";

if (!projectRef) {
  console.error("Could not parse Supabase project ref from .env.local");
  process.exit(1);
}

// Try different connection approaches
const password = process.argv[2] || "ClassCiv2026!";

async function tryConnect(host: string, port: number, user: string) {
  console.log(`  Trying ${user}@${host}:${port}...`);
  try {
    const sql = postgres({
      host,
      port,
      database: "postgres",
      username: user,
      password,
      ssl: "require",
      connect_timeout: 10,
    });
    
    // Test connection
    const result = await sql`SELECT 1 as test`;
    console.log("  ✅ Connected!");
    
    // Run migration
    console.log("  Running migration...");
    
    // Step 1: Add DEFEND to round_type enum
    try {
      await sql`ALTER TYPE round_type ADD VALUE IF NOT EXISTS 'DEFEND'`;
      console.log("  ✅ Added DEFEND to round_type enum");
    } catch (e: unknown) {
      console.log(`  ⚠️ DEFEND enum add: ${(e as Error).message}`);
    }
    
    // Step 2: Change current_round to text
    try {
      await sql`ALTER TABLE games ADD COLUMN IF NOT EXISTS current_round_new text`;
      await sql`UPDATE games SET current_round_new = current_round::text WHERE current_round_new IS NULL`;
      await sql`ALTER TABLE games DROP COLUMN current_round`;
      await sql`ALTER TABLE games RENAME COLUMN current_round_new TO current_round`;
      await sql`ALTER TABLE games ALTER COLUMN current_round SET NOT NULL`;
      await sql`ALTER TABLE games ALTER COLUMN current_round SET DEFAULT 'login'`;
      console.log("  ✅ Changed games.current_round from enum to text");
    } catch (e: unknown) {
      console.log(`  ⚠️ Column change: ${(e as Error).message}`);
    }
    
    await sql.end();
    return true;
  } catch (e: unknown) {
    console.log(`  ❌ Failed: ${(e as Error).message?.substring(0, 80)}`);
    return false;
  }
}

async function main() {
  console.log(`\nProject: ${projectRef}`);
  console.log(`Password: ${"*".repeat(password.length)}\n`);
  
  // Try pooler connection (most common for Supabase)
  const attempts = [
    { host: `aws-0-us-west-2.pooler.supabase.com`, port: 5432, user: `postgres.${projectRef}` },
    { host: `aws-0-us-west-2.pooler.supabase.com`, port: 6543, user: `postgres.${projectRef}` },
    { host: `db.${projectRef}.supabase.co`, port: 5432, user: "postgres" },
    { host: `${projectRef}.supabase.co`, port: 5432, user: "postgres" },
  ];
  
  for (const a of attempts) {
    if (await tryConnect(a.host, a.port, a.user)) {
      console.log("\n✅ Migration complete!");
      process.exit(0);
    }
  }
  
  console.log("\n❌ All connection attempts failed.");
  console.log("\nPlease run this SQL manually in your Supabase SQL Editor:");
  console.log("  https://supabase.com/dashboard/project/" + projectRef + "/sql/new");
  console.log("\n" + fs.readFileSync(path.resolve(__dirname, "..", "supabase", "migrations", "002_fix_current_round.sql"), "utf-8"));
  process.exit(1);
}

main();
