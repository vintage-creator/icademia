import postgres from "postgres";
import fs from "fs";

// Load .env variables
const envText = fs.readFileSync(".env", "utf8");
const envVars = Object.fromEntries(
  envText
    .split("\n")
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("#"))
    .map(line => {
      const idx = line.indexOf("=");
      return [line.slice(0, idx), line.slice(idx + 1)];
    })
);

const sql = postgres(envVars.DATABASE_URL, { ssl: { rejectUnauthorized: false } });

sql`SELECT name, school_code, letterhead_style, primary_color FROM schools`
  .then(rows => {
    console.log("SCHOOLS ROWS:", rows);
    process.exit(0);
  })
  .catch(err => {
    console.error("ERROR:", err);
    process.exit(1);
  });
