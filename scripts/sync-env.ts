import { execSync } from "child_process";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

const force = process.argv.includes("-f") || process.argv.includes("--force");

const envPath = path.resolve(process.cwd(), ".env.production");
const envConfig = dotenv.parse(fs.readFileSync(envPath));

function checkEnvExists(key: string): boolean {
  try {
    execSync(`vercel env ls | grep -q "${key}"`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function setVercelEnv(key: string, value: string) {
  try {
    const exists = checkEnvExists(key);

    if (exists && !force) {
      console.log(
        `⏭️  Skipping ${key} (already exists, use -f to force update)`
      );
      return;
    }

    const command =
      exists && force
        ? `vercel env rm ${key} production -y && vercel env add ${key} production`
        : `vercel env add ${key} production`;

    const child = execSync(command, {
      input: value,
      stdio: ["pipe", "pipe", "pipe"],
    });
    console.log(`✅ ${exists ? "Updated" : "Set"} ${key} in Vercel production`);
  } catch (error) {
    console.error(`❌ Failed to set ${key}:`, error);
  }
}

async function syncEnvVars() {
  console.log("🔄 Syncing environment variables to Vercel production...");
  if (force) {
    console.log("⚠️  Force mode enabled - will update existing variables");
  }

  try {
    execSync("vercel whoami");
  } catch (error) {
    console.error("❌ Please login to Vercel first: vercel login");
    process.exit(1);
  }

  for (const [key, value] of Object.entries(envConfig)) {
    if (key && value) {
      setVercelEnv(key, value);
    }
  }

  console.log("✨ Environment variables sync complete!");
}

syncEnvVars().catch(console.error);
