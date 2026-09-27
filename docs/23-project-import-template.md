# 23 — Project Import Template

This document contains the official JSON schema for importing projects into Soft Showcase.

**How to use:**

1. Give this template to an AI assistant (ChatGPT, Gemini, Claude, etc.).
2. Describe your project.
3. Ask the AI to fill in the template.
4. Copy the resulting JSON.
5. Open `/admin/projects/import`.
6. Paste and validate.
7. Preview and import.

---

## Full JSON Schema (with comments)

```json
{
  "title": "string — Project name (required, 3–200 characters)",

  "shortDescription": "string — One or two sentence summary (required, 10–500 characters)",

  "fullDescription": "string — Markdown or plain-text description. Can be multiple paragraphs. (required)",

  "category": "string — Category name, e.g.: AI / Machine Learning, Web Application, E-Commerce, Mobile App, API / Backend, DevTools, Other (required)",

  "projectType": "string — Type of project, e.g.: Web Application, Mobile App, API, Desktop App, CLI Tool, Chrome Extension (optional)",

  "technologies": [
    "string — Technology name",
    "string — Another technology"
  ],

  "features": [
    "string — Feature description (keep to 1 sentence)",
    "string — Another feature"
  ],

  "specifications": {
    "frontend": "string",
    "backend": "string",
    "database": "string",
    "authentication": "string",
    "aiml": "string (optional)",
    "deployment": "string",
    "payment": "string (optional)"
  },

  "whatsIncluded": [
    "string — What the buyer receives",
    "string — e.g. Source code, Database schema, Documentation"
  ],

  "faq": [
    {
      "question": "string — FAQ question",
      "answer": "string — FAQ answer"
    }
  ],

  "priceMode": "CONTACT | FIXED | STARTING_FROM | FREE",

  "price": null,

  "demoUrl": "string — Full URL to live demo, or empty string",

  "provider": {
    "name": "string — Provider display name (required)",
    "email": "string — Provider email (required, valid email format)",
    "whatsapp": "string — Provider WhatsApp in international format e.g. +919876543210 (optional)"
  }
}
```

---

## Price Mode Reference

| priceMode | Meaning | price field |
|---|---|---|
| `CONTACT` | Contact for pricing (no price shown) | `null` |
| `FIXED` | Exact fixed price | Set to number, e.g. `25000` |
| `STARTING_FROM` | Starting price shown | Set to number, e.g. `15000` |
| `FREE` | Free project | `null` |

---

## Complete Example: AI Resume Analyzer

```json
{
  "title": "AI Resume Analyzer",
  "shortDescription": "An AI-powered web application that analyzes resumes for ATS compatibility, extracts skills, and generates improvement suggestions.",
  "fullDescription": "AI Resume Analyzer is a full-stack web application that helps job seekers improve their resumes using artificial intelligence.\n\nThe platform allows users to upload their resume (PDF or DOCX), which is then analyzed against job descriptions or industry standards. The AI engine extracts key skills, identifies gaps, checks ATS compatibility, and provides actionable improvement suggestions.\n\nBuilt with Python Flask on the backend and a clean JavaScript frontend, the application connects to a PostgreSQL database for storing user sessions and analysis history.",
  "category": "AI / Machine Learning",
  "projectType": "Web Application",
  "technologies": [
    "Python",
    "Flask",
    "PostgreSQL",
    "JavaScript",
    "OpenAI API",
    "PDFPlumber",
    "Docker"
  ],
  "features": [
    "Resume upload supporting PDF and DOCX formats",
    "ATS compatibility score calculation",
    "Skill extraction and keyword analysis",
    "Job description matching and gap analysis",
    "Improvement suggestions with priority ranking",
    "Analysis history saved per user account",
    "Downloadable analysis report (PDF)",
    "Google OAuth authentication"
  ],
  "specifications": {
    "frontend": "HTML5, CSS3, Vanilla JavaScript",
    "backend": "Python 3.11, Flask 3.0",
    "database": "PostgreSQL 16",
    "authentication": "Google OAuth 2.0",
    "aiml": "OpenAI GPT-4o API",
    "deployment": "Docker + Vercel / Railway",
    "storage": "Cloudinary (resume files)"
  },
  "whatsIncluded": [
    "Complete Python + JavaScript source code",
    "PostgreSQL database schema with seed data",
    "Docker Compose configuration",
    "Full API documentation",
    "Installation and deployment guide",
    "Environment variable reference",
    "30 days of email support after delivery"
  ],
  "faq": [
    {
      "question": "Can this project be customized?",
      "answer": "Yes. The project can be customized to your specific requirements. Contact the provider to discuss customization options."
    },
    {
      "question": "What hosting is required?",
      "answer": "The backend requires a Python-capable host (Railway, Render, or VPS). The frontend can be deployed on Vercel. A Neon or Supabase PostgreSQL instance is recommended."
    },
    {
      "question": "Is the OpenAI API key included?",
      "answer": "No. You will need your own OpenAI API key. The project includes clear documentation on how to configure it."
    }
  ],
  "priceMode": "CONTACT",
  "price": null,
  "demoUrl": "https://ai-resume-demo.vercel.app",
  "provider": {
    "name": "Rahul",
    "email": "rahul@example.com",
    "whatsapp": "+919876543210"
  }
}
```

---

## Example: Fixed-Price E-Commerce Template

```json
{
  "title": "Multi-Vendor E-Commerce Platform",
  "shortDescription": "A production-ready multi-vendor e-commerce platform with Stripe payments, vendor dashboards, and admin management.",
  "fullDescription": "A complete multi-vendor marketplace solution built with Next.js 15 and Stripe. Supports multiple vendors, product listings, order management, and automated payouts.",
  "category": "E-Commerce",
  "projectType": "Web Application",
  "technologies": [
    "Next.js",
    "TypeScript",
    "PostgreSQL",
    "Prisma",
    "Stripe",
    "Tailwind CSS"
  ],
  "features": [
    "Multi-vendor product listings",
    "Stripe checkout integration",
    "Vendor dashboard with earnings",
    "Admin dashboard with oversight",
    "Order tracking system",
    "Email notifications"
  ],
  "specifications": {
    "frontend": "Next.js 15, React, Tailwind CSS",
    "backend": "Next.js API Routes, Server Actions",
    "database": "PostgreSQL (Neon)",
    "authentication": "NextAuth.js v5",
    "payment": "Stripe Connect",
    "deployment": "Vercel"
  },
  "whatsIncluded": [
    "Complete source code",
    "Database schema and seed",
    "Stripe integration guide",
    "Deployment guide",
    "Documentation"
  ],
  "faq": [],
  "priceMode": "FIXED",
  "price": 29999,
  "demoUrl": "https://ecom-demo.vercel.app",
  "provider": {
    "name": "Varun",
    "email": "varun@example.com",
    "whatsapp": "+919876543211"
  }
}
```

---

## AI Prompt to Generate Import JSON

You can give this exact prompt to any AI assistant:

```
I need you to generate a JSON object for the Soft Showcase platform project import system.

Use this exact schema (fill in all fields based on the project I describe):

{
  "title": "",
  "shortDescription": "",
  "fullDescription": "",
  "category": "",
  "projectType": "",
  "technologies": [],
  "features": [],
  "specifications": {
    "frontend": "",
    "backend": "",
    "database": "",
    "authentication": "",
    "deployment": ""
  },
  "whatsIncluded": [],
  "faq": [],
  "priceMode": "CONTACT",
  "price": null,
  "demoUrl": "",
  "provider": {
    "name": "[Provider Name]",
    "email": "[provider@email.com]",
    "whatsapp": "[+91XXXXXXXXXX]"
  }
}

My project:
[Describe your project here]

Provider details:
- Name: [Name]
- Email: [email]
- WhatsApp: [number]

Generate valid, complete JSON only. No markdown fences. No extra explanation.
```
