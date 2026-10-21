import { config } from "dotenv";

config({ path: ".env.local" });

/**
 * Loads the IREWIN sample data (categories, companies with logos, published
 * jobs) into Firestore so the public site has something to show.
 *
 *   npm run seed:sample                 # add / refresh sample data
 *   npm run seed:sample -- --dry-run    # print what would be written, touch nothing
 *   npm run seed:sample -- --remove     # delete everything this script added
 *
 * Safe to re-run: documents use fixed IDs, so running again updates them
 * instead of duplicating. Every document is tagged `sample: true`. A category
 * that already exists (created in the dashboard) is left untouched.
 */

const DRY_RUN = process.argv.includes("--dry-run");
const REMOVE = process.argv.includes("--remove");
const DAY = 24 * 60 * 60 * 1000;

async function main() {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const { randomUUID } = await import("node:crypto");
  const { Timestamp } = await import("firebase-admin/firestore");
  const { getStorage } = await import("firebase-admin/storage");
  const { adminAuth, adminDb } = await import("../src/lib/firebase/admin");
  const { slugify } = await import("../src/lib/utils/slugify");
  const { buildSearchKeywords } = await import("../src/lib/utils/searchKeywords");
  const { SAMPLE_CATEGORIES, SAMPLE_COMPANIES, SAMPLE_JOBS, SAMPLE_REFERENCE_DATE } = await import("./sample-data/sample-data");

  if (DRY_RUN) {
    // Offline preview: validate the sample data and show what would be written.
    const companyKeys = new Set(SAMPLE_COMPANIES.map((c) => c.key));
    const catSubs = new Map(SAMPLE_CATEGORIES.map((c) => [c.slug, new Set(c.subcategories.map((n) => slugify(n)))]));
    for (const j of SAMPLE_JOBS) {
      if (!companyKeys.has(j.company)) throw new Error(`Job ${j.id}: unknown company ${j.company}`);
      if (!catSubs.get(j.category)?.has(j.sub)) throw new Error(`Job ${j.id}: unknown category/subcategory ${j.category}/${j.sub}`);
    }
    console.log(`Would write ${REMOVE ? "nothing (remove mode)" : `${SAMPLE_CATEGORIES.length} categories, ${SAMPLE_COMPANIES.length} companies (+ logos), ${SAMPLE_JOBS.length} published jobs`}.`);
    console.log("Dry run — nothing was written.");
    return;
  }

  const db = adminDb();
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (REMOVE) {
    await removeSampleData();
    await recomputeLocationStats();
    return;
  }

  // Author of the seeded docs: the Super Admin, so Admin/Employee edit rules behave normally.
  let createdBy = "sample-seed";
  const ownerEmail = (process.env.SUPER_ADMIN_EMAIL ?? "").trim().toLowerCase();
  if (ownerEmail) {
    try {
      createdBy = (await adminAuth().getUserByEmail(ownerEmail)).uid;
    } catch {
      console.warn(`Couldn't find a user for SUPER_ADMIN_EMAIL; using "${createdBy}" as createdBy.`);
    }
  }

  const now = Date.now();
  const refDate = Date.parse(`${SAMPLE_REFERENCE_DATE}T09:00:00Z`);
  // Shift sample dates so the newest job is "today" whenever the seed runs.
  const shift = (yyyyMmDd: string) => Timestamp.fromMillis(now - (refDate - Date.parse(`${yyyyMmDd}T09:00:00Z`)));

  // ---- Categories -------------------------------------------------------
  const categorySubs = new Map<string, { name: string; slug: string }[]>();
  const categoryNames = new Map<string, string>();
  let catCreated = 0;
  let catSkipped = 0;
  for (const c of SAMPLE_CATEGORIES) {
    const ref = db.collection("categories").doc(c.slug);
    const existing = await ref.get();
    if (existing.exists && !existing.get("sample")) {
      // Keep the dashboard's own category, but add any sample subcategories it's missing.
      const current = (existing.get("subcategories") ?? []) as { name: string; slug: string; isDeleted?: boolean }[];
      const have = new Set(current.map((s) => s.slug));
      const missing = c.subcategories.map((name) => ({ name, slug: slugify(name) })).filter((s) => !have.has(s.slug));
      if (missing.length) await ref.update({ subcategories: [...current, ...missing] });
      categorySubs.set(c.slug, [...current.filter((s) => !s.isDeleted), ...missing]);
      categoryNames.set(c.slug, existing.get("name"));
      console.log(`  "${existing.get("name")}" already existed — added ${missing.length} subcategor${missing.length === 1 ? "y" : "ies"}.`);
      catSkipped++;
      continue;
    }
    const subcategories = c.subcategories.map((name) => ({ name, slug: slugify(name) }));
    categorySubs.set(c.slug, subcategories);
    categoryNames.set(c.slug, c.name);
    const data = {
      name: c.name,
      slug: c.slug,
      enabled: true,
      subcategories,
      createdBy,
      isDeleted: false,
      deletedAt: null,
      createdAt: existing.exists ? existing.get("createdAt") : Timestamp.fromMillis(now),
      sample: true,
    };
    if (!DRY_RUN) await ref.set(data);
    catCreated++;
  }
  console.log(`Categories: ${catCreated} written (with subcategories), ${catSkipped} already existed.`);

  // ---- Companies (+ logo upload) -----------------------------------------
  const companies = new Map<string, { id: string; name: string; logoURL: string | null; website: string }>();
  let logoErrors = 0;
  const bucket = bucketName ? getStorage().bucket(bucketName) : null;
  if (!bucket) console.warn("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is not set — companies will be created without logos.");
  for (const co of SAMPLE_COMPANIES) {
    const id = `sample-${co.key}`;
    let logoURL: string | null = null;
    if (bucket) {
      const path = `company-logos/${id}.svg`;
      const token = randomUUID();
      try {
        await bucket.file(path).save(readFileSync(join(process.cwd(), "scripts", "sample-data", "logos", co.logoFile)), {
          contentType: "image/svg+xml",
          metadata: { cacheControl: "public, max-age=86400", metadata: { firebaseStorageDownloadTokens: token } },
        });
        logoURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
      } catch (err) {
        logoErrors++;
        if (logoErrors === 1) console.warn(`  Logo upload failed (${(err as Error).message}). Companies will be saved without logos.`);
      }
    }
    const ref = db.collection("companies").doc(id);
    const existing = DRY_RUN ? null : await ref.get();
    if (!DRY_RUN) {
      await ref.set({
        name: co.name,
        logoURL,
        website: co.website,
        createdBy,
        isDeleted: false,
        deletedAt: null,
        createdAt: existing?.exists ? existing.get("createdAt") : Timestamp.fromMillis(now),
        sample: true,
      });
    }
    companies.set(co.key, { id, name: co.name, logoURL, website: co.website });
  }
  console.log(`Companies: ${companies.size} written, ${companies.size - logoErrors - (bucket ? 0 : companies.size)} with logos.`);

  // ---- Jobs ---------------------------------------------------------------
  let jobCount = 0;
  const batch = db.batch();
  for (const j of SAMPLE_JOBS) {
    const company = companies.get(j.company);
    if (!company) throw new Error(`Unknown company "${j.company}" in job ${j.id}`);
    const subs = categorySubs.get(j.category) ?? [];
    const sub = subs.find((s) => s.slug === j.sub) ?? null;
    const categoryName = categoryNames.get(j.category) ?? j.category;
    const createdAt = shift(j.created);
    const subName = sub?.name ?? "team";
    const data = {
      title: j.title,
      titleLower: j.title.toLowerCase(),
      companyId: company.id,
      companyName: company.name,
      companyLogoURL: company.logoURL,
      category: j.category,
      categoryName,
      subcategory: sub?.slug ?? null,
      subcategoryName: sub?.name ?? null,
      location: j.location,
      workMode: j.mode,
      employmentType: j.type,
      experienceLevel: j.level,
      salaryMin: j.min,
      salaryMax: j.max,
      currency: "EUR",
      skills: j.skills,
      description: `${j.summary} You'll join ${company.name} and work with experienced colleagues who care about doing things well.`,
      responsibilities: [
        `Deliver day-to-day ${subName.toLowerCase()} work to a high standard`,
        "Work closely with colleagues across the business to hit shared goals",
        "Identify improvements and help put them in place",
        "Keep clear records and report on progress",
      ],
      requirements: [
        `Relevant experience for a ${j.level === "entry" ? "first role" : "role at this level"} in ${categoryName}`,
        `Skills in ${j.skills.slice(0, 3).join(", ")}`,
        "Strong communication and teamwork",
        "Right to work in Ireland",
      ],
      benefits: ["Pension contribution", "Private health insurance", "25 days annual leave", "Learning & development budget", "Bike to Work scheme"],
      applicationUrl: `${company.website}/careers/${j.id}`,
      applicationDeadline: j.deadline ? shift(j.deadline) : null,
      status: "published",
      searchKeywords: buildSearchKeywords(j.title, company.name, j.location),
      isDeleted: false,
      deletedAt: null,
      createdAt,
      updatedAt: createdAt,
      createdBy,
      sample: true,
    };
    batch.set(db.collection("jobs").doc(`sample-${j.id}`), data);
    jobCount++;
  }
  if (!DRY_RUN) await batch.commit();
  console.log(`Jobs: ${jobCount} published jobs written.`);

  if (!DRY_RUN) await recomputeLocationStats();
  console.log(DRY_RUN ? "\nDry run — nothing was written." : "\nDone. Open the dashboard to see the sample data.");

  // ---- helpers --------------------------------------------------------------
  async function removeSampleData() {
    for (const col of ["jobs", "companies", "categories"]) {
      const snap = await db.collection(col).where("sample", "==", true).get();
      if (!DRY_RUN) {
        const b = db.batch();
        snap.docs.forEach((d) => b.delete(d.ref));
        await b.commit();
      }
      console.log(`${col}: ${DRY_RUN ? "would remove" : "removed"} ${snap.size} sample document(s).`);
    }
    if (bucketName && !DRY_RUN) {
      await getStorage().bucket(bucketName).deleteFiles({ prefix: "company-logos/sample-" });
      console.log("Removed sample logos from Storage.");
    }
  }

  // Same logic as scripts/recompute-job-location-stats.ts, so the dashboard's Location chart stays correct.
  async function recomputeLocationStats() {
    if (DRY_RUN) return;
    const jobsSnap = await db.collection("jobs").get();
    const counts = new Map<string, { location: string; count: number }>();
    for (const d of jobsSnap.docs) {
      if (d.get("isDeleted")) continue;
      const location: string | undefined = d.get("location");
      if (!location) continue;
      const slug = slugify(location);
      const entry = counts.get(slug);
      if (entry) entry.count += 1;
      else counts.set(slug, { location, count: 1 });
    }
    const statsCol = db.collection("jobLocationStats");
    const existing = await statsCol.get();
    const b = db.batch();
    existing.docs.forEach((d) => b.delete(d.ref));
    counts.forEach((entry, slug) => b.set(statsCol.doc(slug), entry));
    await b.commit();
    console.log(`Location stats recomputed (${counts.size} locations).`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
