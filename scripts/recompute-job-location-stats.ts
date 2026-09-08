import { config } from "dotenv";

config({ path: ".env.local" });

/**
 * Recomputes jobLocationStats from scratch by scanning every non-deleted job.
 * Safe to re-run any time as a drift-correction tool, not just a one-time
 * migration — it deletes all existing jobLocationStats docs first, so it's
 * idempotent regardless of how the collection got out of sync.
 *
 *   npm run recompute:job-location-stats
 */
async function main() {
  const { adminDb: getDbClient } = await import("../src/lib/firebase/admin");
  const { slugify } = await import("../src/lib/utils/slugify");

  const adminDb = getDbClient();

  const jobsSnap = await adminDb.collection("jobs").get();
  const counts = new Map<string, { location: string; count: number }>();
  for (const doc of jobsSnap.docs) {
    const data = doc.data();
    if (data.isDeleted) continue;
    const location: string | undefined = data.location;
    if (!location) continue;
    const slug = slugify(location);
    const existing = counts.get(slug);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(slug, { location, count: 1 });
    }
  }

  const statsCol = adminDb.collection("jobLocationStats");
  const existingStats = await statsCol.get();

  const batch = adminDb.batch();
  for (const doc of existingStats.docs) {
    batch.delete(doc.ref);
  }
  for (const [slug, entry] of counts) {
    batch.set(statsCol.doc(slug), entry);
  }
  await batch.commit();

  console.log(`Recomputed jobLocationStats: ${counts.size} distinct location(s) from ${jobsSnap.size} job doc(s).`);
  for (const entry of counts.values()) {
    console.log(`  ${entry.location}: ${entry.count}`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
