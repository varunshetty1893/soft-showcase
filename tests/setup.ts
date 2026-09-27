import dotenv from "dotenv";
import path from "path";

// Load .env.local first (overrides .env), then .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
