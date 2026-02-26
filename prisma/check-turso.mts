import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const users = await client.execute('SELECT id, name, email, role FROM "User"');
console.log("Users:", JSON.stringify(users.rows, null, 2));

const sections = await client.execute('SELECT slug, title, status FROM "Section" ORDER BY "sortOrder"');
console.log("Sections:", sections.rows.length);
