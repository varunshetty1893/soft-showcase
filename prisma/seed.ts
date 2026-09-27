// prisma/seed.ts
// Seeds the database with default categories, technologies, and admin user.
// Run with: npx prisma db seed
// (configured via package.json prisma.seed field)

import { PrismaClient } from "@prisma/client";
import { DEFAULT_CATEGORIES } from "../config/categories";
import { DEFAULT_TECHNOLOGIES } from "../config/technologies";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Categories ─────────────────────────────────────────────────────────────
  console.log("  Creating categories...");
  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`  ✅ ${DEFAULT_CATEGORIES.length} categories seeded.`);

  // ── Technologies ───────────────────────────────────────────────────────────
  console.log("  Creating technologies...");
  for (const tech of DEFAULT_TECHNOLOGIES) {
    await prisma.technology.upsert({
      where: { slug: tech.slug },
      update: {},
      create: tech,
    });
  }
  console.log(`  ✅ ${DEFAULT_TECHNOLOGIES.length} technologies seeded.`);

  // ── Admin user ─────────────────────────────────────────────────────────────
  // The admin user is identified by the ADMIN_EMAIL environment variable.
  // This record is created with isAdmin: true so that when the admin signs in
  // with Google for the first time, NextAuth upserts the user and preserves
  // the isAdmin flag.
  //
  // IMPORTANT: Set ADMIN_EMAIL in your .env.local before running this seed.
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    console.log(`  Creating admin user: ${adminEmail}`);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { isAdmin: true },
      create: {
        email: adminEmail,
        name: "Admin",
        isAdmin: true,
      },
    });
    console.log("  ✅ Admin user seeded.");
  } else {
    console.log(
      "  ⚠️  ADMIN_EMAIL not set — skipping admin user seed. Set it in .env.local."
    );
  }

  console.log("✅ Seeding complete.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
