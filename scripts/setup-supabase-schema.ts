import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load environment variables
dotenv.config();

async function setupSchema() {
  try {
    console.log("Setting up database schema...");

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(
        "Missing Supabase environment variables. Check your .env file."
      );
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Read SQL schema file
    const schemaPath = path.join(__dirname, "supabase-schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    console.log("Executing schema SQL...");

    // Execute the SQL statement
    const { error } = await supabase.rpc("pgbouncer_exec", {
      query: schema,
    });

    if (error) {
      console.error("Failed to execute SQL:", error);
      console.log(
        "\nIMPORTANT: You need to run the SQL script manually in the Supabase dashboard SQL Editor."
      );
      console.log("1. Log in to your Supabase account");
      console.log("2. Navigate to your project");
      console.log("3. Go to the SQL Editor section");
      console.log("4. Create a new query");
      console.log("5. Paste the contents of scripts/supabase-schema.sql");
      console.log("6. Execute the SQL script");
      process.exit(1);
    }

    console.log("Database schema setup successfully!");
  } catch (error) {
    console.error("Error setting up schema:", error);
    console.log(
      "\nIMPORTANT: You need to run the SQL script manually in the Supabase dashboard SQL Editor."
    );
    console.log("1. Log in to your Supabase account");
    console.log("2. Navigate to your project");
    console.log("3. Go to the SQL Editor section");
    console.log("4. Create a new query");
    console.log("5. Paste the contents of scripts/supabase-schema.sql");
    console.log("6. Execute the SQL script");
  }
}

setupSchema();
