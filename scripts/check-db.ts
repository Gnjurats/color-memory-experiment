import { neon } from "@neondatabase/serverless";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const res = await sql`SELECT COUNT(*) as count FROM sequences`;
  console.log("Sequences count:", res[0].count);
  const res2 = await sql`SELECT COUNT(*) as count FROM participants`;
  console.log("Participants count:", res2[0].count);
  const res3 = await sql`SELECT COUNT(*) as count FROM trials`;
  console.log("Trials count:", res3[0].count);
}

main();
