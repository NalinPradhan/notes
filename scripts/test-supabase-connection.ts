#!/usr/bin/env ts-node
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
dotenv.config();

async function testSupabaseConnection() {
  console.log("Testing Supabase connection...");

  // Check if environment variables are set
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error(
      "❌ NEXT_PUBLIC_SUPABASE_URL is not defined in environment variables"
    );
    return;
  }

  if (!process.env.SUPABASE_SERVICE_KEY) {
    console.error(
      "❌ SUPABASE_SERVICE_KEY is not defined in environment variables"
    );
    console.log("⚠️ Falling back to NEXT_PUBLIC_SUPABASE_ANON_KEY for testing");

    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is also not defined");
      return;
    }
  }

  try {
    // Create client with service role key (preferred) or anon key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        ""
    );

    // Test connection with a simple query
    console.log("Attempting to connect to Supabase...");

    // Try to list tables
    console.log("Querying Tenant table...");
    const { data: tenants, error: tenantError } = await supabase
      .from("Tenant")
      .select("*")
      .limit(1);

    if (tenantError) {
      console.error("❌ Error querying Tenant table:", tenantError);
      console.log("\nTrying User table instead...");

      // Try another table
      const { data: users, error: userError } = await supabase
        .from("User")
        .select("*")
        .limit(1);

      if (userError) {
        console.error("❌ Error querying User table:", userError);
        console.error("\n❌ Connection test failed");
        return;
      }

      console.log("✅ Successfully queried User table");
      console.log(`✅ Found ${users.length} users`);
    } else {
      console.log("✅ Successfully queried Tenant table");
      console.log(`✅ Found ${tenants.length} tenants`);
    }

    // Test method chaining
    console.log("\nTesting method chaining (using .eq)...");
    const { data: filteredUsers, error: chainError } = await supabase
      .from("User")
      .select("email")
      .eq("role", "ADMIN")
      .limit(1);

    if (chainError) {
      console.error("❌ Error with chained methods:", chainError);
    } else {
      console.log("✅ Method chaining works correctly!");
      console.log(`✅ Found ${filteredUsers.length} admin users`);
    }

    console.log("\n✅ Supabase connection successful!");
  } catch (error) {
    console.error("❌ Failed to connect to Supabase:", error);
  }
}

// Run the test
testSupabaseConnection().catch(console.error);
