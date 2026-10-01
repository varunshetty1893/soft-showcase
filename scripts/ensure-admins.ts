// scripts/ensure-admins.ts
// Standalone script to ensure current owner/admin emails have isAdmin=true in DB before deploying.
// Run before deployment: npm run ensure-admins

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmails = [
    ...(process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(",") : []),
    ...(process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL] : []),
  ]
    .map((e) => e.trim().toLowerCase())
    .filter((e) => Boolean(e) && e.includes("@"));

  if (adminEmails.length === 0) {
    console.log("ℹ️  No ADMIN_EMAILS or ADMIN_EMAIL configured in environment.");
    return;
  }

  console.log(`🔐 Ensuring admin status for ${adminEmails.length} configured email(s)...`);

  for (const email of adminEmails) {
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          isAdmin: true,
          role: "admin",
          emailVerified: existing.emailVerified || new Date(),
        },
      });
      console.log(`  ✅ Verified and set isAdmin=true for: ${email}`);
    } else {
      await prisma.user.create({
        data: {
          email,
          name: email.split("@")[0],
          isAdmin: true,
          role: "admin",
          emailVerified: new Date(),
        },
      });
      console.log(`  ✅ Created admin user with isAdmin=true for: ${email}`);
    }
  }

  console.log("🎉 Ensure-admins completed successfully.");
}

main()
  .catch((e) => {
    console.error("❌ ensure-admins failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
