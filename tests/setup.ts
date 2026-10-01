import dotenv from "dotenv";
import path from "path";

// Load .env.local first (overrides .env), then .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

if (!process.env.DATABASE_URL) {
  process.env.USE_MOCK_DB = "true";
  process.env.DATABASE_URL = "postgresql://mock:mock@localhost:5432/mock";
}
