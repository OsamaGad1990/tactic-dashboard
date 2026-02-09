const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const dbUrl = env.match(/DATABASE_URL=(.+)/)?.[1]?.trim();
const postgres = require('postgres');
const sql = postgres(dbUrl, { prepare: false });

async function main() {
    const rows = await sql`
        SELECT for_roles, for_all, audience_type, for_user
        FROM notifications
        LIMIT 5
    `;
    for (const r of rows) {
        console.log(JSON.stringify({
            for_roles: r.for_roles,
            type_roles: typeof r.for_roles,
            isArr: Array.isArray(r.for_roles),
            for_all: r.for_all,
            type_all: typeof r.for_all,
            audience_type: r.audience_type,
        }));
    }
    await sql.end();
}

main().catch(e => { console.error(e); process.exit(1); });
