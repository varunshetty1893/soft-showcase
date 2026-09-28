// prisma/seed.ts
// Seeds the database with default categories, technologies, admin user,
// and verified creator projects including Varun Shetty's Global Farmer & Smart Fitness Planner.
// Run with: npx prisma db seed

import { PrismaClient } from "@prisma/client";
import { DEFAULT_CATEGORIES } from "../config/categories";
import { DEFAULT_TECHNOLOGIES } from "../config/technologies";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── 1. Categories ──────────────────────────────────────────────────────────
  console.log("  Creating categories...");
  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`  ✅ ${DEFAULT_CATEGORIES.length} categories seeded.`);

  // ── 2. Technologies ────────────────────────────────────────────────────────
  console.log("  Creating technologies...");
  for (const tech of DEFAULT_TECHNOLOGIES) {
    await prisma.technology.upsert({
      where: { slug: tech.slug },
      update: {},
      create: tech,
    });
  }
  console.log(`  ✅ ${DEFAULT_TECHNOLOGIES.length} technologies seeded.`);

  // ── 3. Admin user ──────────────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || "shettymu25@gmail.com";
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
  }

  // ── 4. Seed Provider: Varun Shetty ─────────────────────────────────────────
  console.log("  Creating provider: Varun Shetty...");
  const varunProvider = await prisma.projectProvider.upsert({
    where: { email: "shettybvarun@gmail.com" },
    update: {
      displayName: "Varun Shetty",
      whatsappNumber: "918123665363",
      bio: "Full-Stack & Python / ML Developer. Creator of Global Farmer direct agricultural commerce and Smart Fitness & Diet Planner.",
      avatarUrl: "https://avatars.githubusercontent.com/u/170342896?v=4",
      showEmail: true,
      showWhatsapp: true,
      providerConsentConfirmed: true,
      providerConsentConfirmedAt: new Date(),
    },
    create: {
      displayName: "Varun Shetty",
      email: "shettybvarun@gmail.com",
      whatsappNumber: "918123665363",
      bio: "Full-Stack & Python / ML Developer. Creator of Global Farmer direct agricultural commerce and Smart Fitness & Diet Planner.",
      avatarUrl: "https://avatars.githubusercontent.com/u/170342896?v=4",
      showEmail: true,
      showWhatsapp: true,
      providerConsentConfirmed: true,
      providerConsentConfirmedAt: new Date(),
    },
  });
  console.log("  ✅ Varun Shetty provider seeded.");

  // Fetch Category references
  const ecommerceCat = await prisma.category.findUnique({ where: { slug: "e-commerce" } });
  const aimlCat = await prisma.category.findUnique({ where: { slug: "ai-ml" } });

  // ── 5. Project 1: Global Farmer ────────────────────────────────────────────
  if (ecommerceCat) {
    console.log("  Creating project: Global Farmer...");
    const gfProject = await prisma.project.upsert({
      where: { slug: "global-farmer" },
      update: {
        title: "Global Farmer — Direct Agri-Produce E-Commerce Platform",
        shortDescription:
          "PHP & MySQL direct farm-to-consumer e-commerce marketplace cutting out middlemen with cart, checkout, and full admin operations.",
        fullDescription:
          "Global Farmer is an open-source, full-stack agricultural e-commerce web platform engineered with PHP and MySQLi. It directly connects independent farmers with local households and commercial buyers. Features an automated customer storefront with live product galleries, responsive shopping carts, address books, order tracking, and a session-protected admin control panel with inventory reports, order processing, and user management.",
        status: "PUBLISHED",
        featured: true,
        priceMode: "FIXED",
        price: 14999,
        demoUrl: "https://github.com/varunshetty1893/global-farmer",
        projectType: "Full-Stack E-Commerce System",
        whatsIncluded: [
          "Complete PHP 7.4+ & MySQLi Source Code",
          "Full globalfarmer_db.sql database schema with sample data",
          "Customer storefront with Cart, Checkout & Order History",
          "Session-protected /gf-manage admin panel with analytics",
          "Setup documentation for XAMPP, WAMP, and LAMP servers",
        ],
        categoryId: ecommerceCat.id,
        providerId: varunProvider.id,
      },
      create: {
        title: "Global Farmer — Direct Agri-Produce E-Commerce Platform",
        slug: "global-farmer",
        shortDescription:
          "PHP & MySQL direct farm-to-consumer e-commerce marketplace cutting out middlemen with cart, checkout, and full admin operations.",
        fullDescription:
          "Global Farmer is an open-source, full-stack agricultural e-commerce web platform engineered with PHP and MySQLi. It directly connects independent farmers with local households and commercial buyers. Features an automated customer storefront with live product galleries, responsive shopping carts, address books, order tracking, and a session-protected admin control panel with inventory reports, order processing, and user management.",
        status: "PUBLISHED",
        featured: true,
        priceMode: "FIXED",
        price: 14999,
        demoUrl: "https://github.com/varunshetty1893/global-farmer",
        projectType: "Full-Stack E-Commerce System",
        whatsIncluded: [
          "Complete PHP 7.4+ & MySQLi Source Code",
          "Full globalfarmer_db.sql database schema with sample data",
          "Customer storefront with Cart, Checkout & Order History",
          "Session-protected /gf-manage admin panel with analytics",
          "Setup documentation for XAMPP, WAMP, and LAMP servers",
        ],
        categoryId: ecommerceCat.id,
        providerId: varunProvider.id,
      },
    });

    // Clean existing related entities
    await prisma.projectImage.deleteMany({ where: { projectId: gfProject.id } });
    await prisma.projectFeature.deleteMany({ where: { projectId: gfProject.id } });
    await prisma.projectSpecification.deleteMany({ where: { projectId: gfProject.id } });
    await prisma.projectFaq.deleteMany({ where: { projectId: gfProject.id } });

    // Seed Global Farmer Images
    await prisma.projectImage.createMany({
      data: [
        {
          projectId: gfProject.id,
          url: "https://raw.githubusercontent.com/varunshetty1893/global-farmer/main/assets/img/header-bg.jpg",
          storageKey: "gf-1",
          altText: "Global Farmer Marketplace Header & Fresh Produce Catalog",
          isPrimary: true,
          sortOrder: 1,
        },
        {
          projectId: gfProject.id,
          url: "https://raw.githubusercontent.com/varunshetty1893/global-farmer/main/logo/logo.png",
          storageKey: "gf-2",
          altText: "Global Farmer Brand Logo & Identity",
          isPrimary: false,
          sortOrder: 2,
        },
      ],
    });

    // Seed Global Farmer Features
    await prisma.projectFeature.createMany({
      data: [
        { projectId: gfProject.id, feature: "Direct farm-to-consumer store with category filtering", sortOrder: 1 },
        { projectId: gfProject.id, feature: "Full shopping cart, dynamic order calculation & checkout", sortOrder: 2 },
        { projectId: gfProject.id, feature: "Session-protected admin management (/gf-manage) dashboard", sortOrder: 3 },
        { projectId: gfProject.id, feature: "Customer address book, account profile and order tracking", sortOrder: 4 },
      ],
    });

    // Seed Global Farmer Specs
    await prisma.projectSpecification.createMany({
      data: [
        { projectId: gfProject.id, key: "Backend", value: "PHP 7.4+ with MySQLi", sortOrder: 1 },
        { projectId: gfProject.id, key: "Database", value: "MySQL 5.7+ / MariaDB (globalfarmer_db.sql)", sortOrder: 2 },
        { projectId: gfProject.id, key: "Frontend", value: "HTML5, CSS3, JavaScript, FontAwesome", sortOrder: 3 },
        { projectId: gfProject.id, key: "Compatibility", value: "XAMPP / WAMP / LAMP Environments", sortOrder: 4 },
      ],
    });

    // Seed Global Farmer FAQ
    await prisma.projectFaq.createMany({
      data: [
        {
          projectId: gfProject.id,
          question: "How do I install Global Farmer locally?",
          answer: "Place the project in your XAMPP htdocs folder, import globalfarmer_db.sql into phpMyAdmin, and configure dbconnection.php.",
          sortOrder: 1,
        },
      ],
    });

    console.log("  ✅ Global Farmer project seeded.");
  }

  // ── 6. Project 2: Smart Fitness & Diet Planner ─────────────────────────────
  if (aimlCat) {
    console.log("  Creating project: Smart Fitness & Diet Planner...");
    const fitProject = await prisma.project.upsert({
      where: { slug: "smart-fitness-diet-planner" },
      update: {
        title: "Smart Fitness & Diet Planner",
        shortDescription:
          "Intelligent Python Flask & SQLite health recommendation engine providing customized diet plans and workout routines.",
        fullDescription:
          "A smart, rule-based Python web application built with Flask and SQLite that delivers personalized diet and exercise recommendations. By analyzing user health parameters—including age, weight, height, activity level, and hydration status—the engine computes real-time BMI metrics, caloric intake requirements, and lifestyle plans, accompanied by an administrative analytics dashboard.",
        status: "PUBLISHED",
        featured: true,
        priceMode: "FIXED",
        price: 19999,
        demoUrl: "https://github.com/varunshetty1893/Smart-Fitness-Diet-Planner-Python-Project",
        projectType: "AI / Rule-Based Web App",
        whatsIncluded: [
          "Full Python 3.8+ & Flask application source code",
          "Pre-configured SQLite diet.db database and models",
          "Rule-based recommendation engine for nutrition and workouts",
          "Responsive Jinja2 HTML5 & CSS3 frontend templates",
          "Admin dashboard with user management and credential controls",
        ],
        categoryId: aimlCat.id,
        providerId: varunProvider.id,
      },
      create: {
        title: "Smart Fitness & Diet Planner",
        slug: "smart-fitness-diet-planner",
        shortDescription:
          "Intelligent Python Flask & SQLite health recommendation engine providing customized diet plans and workout routines.",
        fullDescription:
          "A smart, rule-based Python web application built with Flask and SQLite that delivers personalized diet and exercise recommendations. By analyzing user health parameters—including age, weight, height, activity level, and hydration status—the engine computes real-time BMI metrics, caloric intake requirements, and lifestyle plans, accompanied by an administrative analytics dashboard.",
        status: "PUBLISHED",
        featured: true,
        priceMode: "FIXED",
        price: 19999,
        demoUrl: "https://github.com/varunshetty1893/Smart-Fitness-Diet-Planner-Python-Project",
        projectType: "AI / Rule-Based Web App",
        whatsIncluded: [
          "Full Python 3.8+ & Flask application source code",
          "Pre-configured SQLite diet.db database and models",
          "Rule-based recommendation engine for nutrition and workouts",
          "Responsive Jinja2 HTML5 & CSS3 frontend templates",
          "Admin dashboard with user management and credential controls",
        ],
        categoryId: aimlCat.id,
        providerId: varunProvider.id,
      },
    });

    // Clean existing related entities
    await prisma.projectImage.deleteMany({ where: { projectId: fitProject.id } });
    await prisma.projectFeature.deleteMany({ where: { projectId: fitProject.id } });
    await prisma.projectSpecification.deleteMany({ where: { projectId: fitProject.id } });
    await prisma.projectFaq.deleteMany({ where: { projectId: fitProject.id } });

    // Seed Smart Fitness Images
    await prisma.projectImage.createMany({
      data: [
        {
          projectId: fitProject.id,
          url: "https://raw.githubusercontent.com/varunshetty1893/Smart-Fitness-Diet-Planner-Python-Project/main/static/images/hero-bg.png",
          storageKey: "fit-1",
          altText: "Smart Fitness & Diet Planner Recommendation Dashboard",
          isPrimary: true,
          sortOrder: 1,
        },
        {
          projectId: fitProject.id,
          url: "https://raw.githubusercontent.com/varunshetty1893/Smart-Fitness-Diet-Planner-Python-Project/main/static/images/1.png",
          storageKey: "fit-2",
          altText: "Fitness & Diet Planner Analytics & Health Metrics",
          isPrimary: false,
          sortOrder: 2,
        },
      ],
    });

    // Seed Smart Fitness Features
    await prisma.projectFeature.createMany({
      data: [
        { projectId: fitProject.id, feature: "Automatic Body Mass Index (BMI) calculator and health tier analysis", sortOrder: 1 },
        { projectId: fitProject.id, feature: "Rule-based recommendation engine for personalized meal plans", sortOrder: 2 },
        { projectId: fitProject.id, feature: "Targeted exercise suggestions tailored to fitness and activity level", sortOrder: 3 },
        { projectId: fitProject.id, feature: "Hydration tracking and admin user control dashboard", sortOrder: 4 },
      ],
    });

    // Seed Smart Fitness Specs
    await prisma.projectSpecification.createMany({
      data: [
        { projectId: fitProject.id, key: "Backend Framework", value: "Python 3.8+ & Flask Web Framework", sortOrder: 1 },
        { projectId: fitProject.id, key: "Database", value: "SQLite (diet.db)", sortOrder: 2 },
        { projectId: fitProject.id, key: "Engine", value: "Rule-Based Health & Calorie Logic Engine", sortOrder: 3 },
        { projectId: fitProject.id, key: "Frontend", value: "Jinja2 Templates, HTML5 & CSS3", sortOrder: 4 },
      ],
    });

    // Seed Smart Fitness FAQ
    await prisma.projectFaq.createMany({
      data: [
        {
          projectId: fitProject.id,
          question: "Can the rule-based logic be expanded?",
          answer: "Yes, the decision engine in app.py is modular and easily extensible to include new dietary preferences or medical conditions.",
          sortOrder: 1,
        },
      ],
    });

    console.log("  ✅ Smart Fitness & Diet Planner project seeded.");
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
