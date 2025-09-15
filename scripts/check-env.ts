#!/usr/bin/env ts-node
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load environment variables
dotenv.config();

// Define required environment variables
const requiredEnvVars = [
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    description: "The URL of your Supabase project",
    required: true,
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    description:
      "The anon key for your Supabase project (for client-side requests)",
    required: true,
  },
  {
    name: "SUPABASE_SERVICE_KEY",
    description:
      "The service role key for your Supabase project (for admin/server operations)",
    required: true,
  },
  {
    name: "JWT_SECRET",
    description: "Secret key for signing JWT tokens",
    required: true,
    defaultValue: "your-secret-key",
  },
];

// Check for .env file
function checkEnvFile() {
  const envFilePath = path.join(process.cwd(), ".env");
  const envLocalPath = path.join(process.cwd(), ".env.local");
  const envProductionPath = path.join(process.cwd(), ".env.production");

  if (fs.existsSync(envFilePath)) {
    console.log("✅ .env file exists");
  } else {
    console.warn("⚠️ No .env file found");
  }

  if (fs.existsSync(envLocalPath)) {
    console.log("✅ .env.local file exists");
  }

  if (fs.existsSync(envProductionPath)) {
    console.log("✅ .env.production file exists");
  }
}

// Check environment variables
function checkEnvironmentVariables() {
  console.log("\n🔍 Checking environment variables...");

  let allValid = true;
  let missingRequired = false;

  requiredEnvVars.forEach((envVar) => {
    const value = process.env[envVar.name];

    if (!value) {
      if (envVar.required) {
        console.error(
          `❌ Required ${envVar.name} is missing - ${envVar.description}`
        );
        missingRequired = true;
        allValid = false;
      } else {
        console.warn(
          `⚠️ Optional ${envVar.name} is not set - ${envVar.description}`
        );
      }
    } else if (envVar.defaultValue && value === envVar.defaultValue) {
      console.warn(
        `⚠️ ${envVar.name} is using the default value - consider changing it`
      );
    } else {
      // Mask sensitive values
      const maskedValue =
        value.substring(0, 3) + "..." + value.substring(value.length - 3);
      console.log(`✅ ${envVar.name} is set [${maskedValue}]`);
    }
  });

  return { allValid, missingRequired };
}

// Create example .env file
function createExampleEnvFile() {
  const exampleEnvPath = path.join(process.cwd(), ".env.example");
  let exampleEnvContent = "# Environment Variables Example\n";
  exampleEnvContent += "# Copy this file to .env and fill in your values\n\n";

  requiredEnvVars.forEach((envVar) => {
    exampleEnvContent += `# ${envVar.description}\n`;
    exampleEnvContent += `${envVar.name}=${envVar.defaultValue || ""}\n\n`;
  });

  fs.writeFileSync(exampleEnvPath, exampleEnvContent);
  console.log(`\n✅ Created example environment file at ${exampleEnvPath}`);
}

// Vercel deployment check
function checkVercelDeployment() {
  console.log("\n🚀 Vercel Deployment Tips:");
  console.log(
    "- Make sure all environment variables are added to your Vercel project settings"
  );
  console.log(
    "- Environment variables used during build (like database URLs) need to be included in Build Environment Variables"
  );
  console.log(
    "- NEXT_PUBLIC_ prefixed variables will be exposed to the browser"
  );
  console.log(
    "- Sensitive keys like SUPABASE_SERVICE_KEY should never be NEXT_PUBLIC_"
  );
  console.log(
    "- You might need to redeploy after adding or changing environment variables"
  );
}

// Main function
async function checkEnv() {
  console.log("🔄 Checking application environment configuration...");

  // Check for env files
  checkEnvFile();

  // Check environment variables
  const { allValid, missingRequired } = checkEnvironmentVariables();

  // Create example .env file
  createExampleEnvFile();

  // Display Vercel deployment tips
  checkVercelDeployment();

  // Final status
  if (allValid) {
    console.log("\n✅ All required environment variables are set!");
  } else if (missingRequired) {
    console.error(
      "\n❌ Some required environment variables are missing. Please set them and try again."
    );
  } else {
    console.warn(
      "\n⚠️ Some optional environment variables are missing or using defaults."
    );
  }
}

// Run the checks
checkEnv().catch(console.error);
