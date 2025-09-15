#!/usr/bin/env ts-node
/**
 * Vercel Environment Setup Helper
 *
 * This script helps you verify and configure your environment variables for Vercel deployment.
 */

import * as readline from "readline";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create readline interface for user interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Required environment variables
const requiredVars = [
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    description:
      "Your Supabase project URL (e.g., https://xyzproject.supabase.co)",
    sensitive: false,
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    description: "Your Supabase anon/public key (for client-side operations)",
    sensitive: true,
  },
  {
    name: "SUPABASE_SERVICE_KEY",
    description: "Your Supabase service role key (for admin operations)",
    sensitive: true,
  },
  {
    name: "JWT_SECRET",
    description: "A strong secret key for JWT token encryption",
    sensitive: true,
  },
];

// Vercel deployment command generator
function generateVercelCommands(vars) {
  console.log("\n\n====== VERCEL DEPLOYMENT COMMANDS ======");
  console.log("Run these commands to set up your Vercel environment:\n");

  // Project linking command
  console.log("# Link to your Vercel project (run once)");
  console.log("vercel link\n");

  // Environment variable commands
  console.log("# Set environment variables");
  vars.forEach((v) => {
    // Only include if the value was provided
    if (v.value) {
      console.log(`vercel env add ${v.name}`);
    }
  });

  console.log("\n# Deploy with environment variables");
  console.log("vercel --prod\n");

  console.log("====== ENVIRONMENT VERIFICATION ======");
  console.log(
    "After deploying, run this to verify variables are set correctly:"
  );
  console.log("vercel env ls\n");
}

// Check if environment variables are already set
function checkExistingVars() {
  console.log("Checking existing environment variables...\n");

  requiredVars.forEach((v) => {
    const exists = process.env[v.name] ? "✅ SET" : "❌ MISSING";
    console.log(`${v.name}: ${exists}`);
  });

  console.log("\n");
}

// Main function
async function main() {
  console.log("=== Vercel Environment Configuration Helper ===\n");
  console.log(
    "This tool will help you verify your environment variables for Vercel deployment.\n"
  );

  // Check existing variables
  checkExistingVars();

  // Collect values from user if needed
  const collectedVars = [];

  for (const v of requiredVars) {
    const existingValue = process.env[v.name];

    if (existingValue) {
      console.log(
        `${v.name} is already set ${
          v.sensitive ? "(value hidden)" : `to: ${existingValue}`
        }`
      );
      collectedVars.push({
        ...v,
        value: existingValue,
      });
      continue;
    }

    // Prompt for missing values
    const value = await new Promise((resolve) => {
      rl.question(
        `Enter value for ${v.name} (${v.description}): `,
        (answer) => {
          resolve(answer.trim());
        }
      );
    });

    collectedVars.push({
      ...v,
      value,
    });
  }

  // Generate Vercel commands
  generateVercelCommands(collectedVars);

  rl.close();
}

main().catch(console.error);
