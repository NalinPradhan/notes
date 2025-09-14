import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables from .env file when in Node.js environment
// Next.js automatically loads .env in the browser
if (typeof window === "undefined") {
  dotenv.config();
}

// Default to empty strings for type safety, but this will throw a proper error when createClient is called
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing Supabase environment variables. Check your .env file."
  );
}

// Client for browser usage (limited permissions)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client for server operations (full permissions)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase;
