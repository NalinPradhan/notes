import * as dotenv from "dotenv";
dotenv.config();
import { createClient } from "@supabase/supabase-js";

async function testConnection() {
  try {
    console.log("Testing Supabase connection...");

    // Log environment variables (without sensitive values)
    console.log("Environment variables:");
    console.log(
      "- NEXT_PUBLIC_SUPABASE_URL:",
      process.env.NEXT_PUBLIC_SUPABASE_URL ? "Defined ✓" : "Not defined ✗"
    );
    console.log(
      "- NEXT_PUBLIC_SUPABASE_ANON_KEY:",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Defined ✓" : "Not defined ✗"
    );
    console.log(
      "- SUPABASE_SERVICE_KEY:",
      process.env.SUPABASE_SERVICE_KEY ? "Defined ✓" : "Not defined ✗"
    );

    // Create a test client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Required environment variables are missing");
    }

    console.log("Creating Supabase client...");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try a simple query
    console.log("Testing database connection...");
    const { data, error } = await supabase.from("Tenant").select("*").limit(1);

    if (error) {
      throw error;
    }

    console.log("Connection successful!");
    console.log("Retrieved data:", data);
  } catch (error) {
    console.error("Error testing connection:", error);
  }
}

testConnection();
