import * as dotenv from "dotenv";
dotenv.config();
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

// Create a direct Supabase client for seeding
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "Missing Supabase environment variables. Check your .env file."
  );
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  try {
    console.log("Seeding database...");

    // Clear existing data (in reverse order to respect foreign keys)
    await supabaseAdmin
      .from("Note")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin
      .from("User")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin
      .from("Tenant")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    console.log("Database cleared");

    // Create password hash
    const password = await bcrypt.hash("password", 10);

    // Create Acme tenant
    const { data: acmeTenant, error: acmeError } = await supabaseAdmin
      .from("Tenant")
      .insert({
        name: "Acme Corporation",
        slug: "acme",
        subscriptionPlan: "FREE",
      })
      .select()
      .single();

    if (acmeError) {
      throw acmeError;
    }

    // Create Globex tenant
    const { data: globexTenant, error: globexError } = await supabaseAdmin
      .from("Tenant")
      .insert({
        name: "Globex Corporation",
        slug: "globex",
        subscriptionPlan: "FREE",
      })
      .select()
      .single();

    if (globexError) {
      throw globexError;
    }

    console.log("Tenants created");

    // Create Acme users
    const { error: acmeUsersError } = await supabaseAdmin.from("User").insert([
      {
        email: "admin@acme.test",
        password,
        role: "ADMIN",
        tenantId: acmeTenant.id,
      },
      {
        email: "user@acme.test",
        password,
        role: "MEMBER",
        tenantId: acmeTenant.id,
      },
    ]);

    if (acmeUsersError) {
      throw acmeUsersError;
    }

    // Create Globex users
    const { error: globexUsersError } = await supabaseAdmin
      .from("User")
      .insert([
        {
          email: "admin@globex.test",
          password,
          role: "ADMIN",
          tenantId: globexTenant.id,
        },
        {
          email: "user@globex.test",
          password,
          role: "MEMBER",
          tenantId: globexTenant.id,
        },
      ]);

    if (globexUsersError) {
      throw globexUsersError;
    }

    console.log("Users created");

    // Find admin users to create sample notes
    const { data: acmeAdmin } = await supabaseAdmin
      .from("User")
      .select()
      .eq("email", "admin@acme.test")
      .single();

    const { data: globexAdmin } = await supabaseAdmin
      .from("User")
      .select()
      .eq("email", "admin@globex.test")
      .single();

    // Create a note for Acme
    if (acmeAdmin) {
      const { error: acmeNoteError } = await supabaseAdmin.from("Note").insert({
        title: "Welcome to Acme Notes",
        content: "This is a sample note for Acme Corporation.",
        tenantId: acmeTenant.id,
        userId: acmeAdmin.id,
      });

      if (acmeNoteError) {
        throw acmeNoteError;
      }
    }

    // Create a note for Globex
    if (globexAdmin) {
      const { error: globexNoteError } = await supabaseAdmin
        .from("Note")
        .insert({
          title: "Welcome to Globex Notes",
          content: "This is a sample note for Globex Corporation.",
          tenantId: globexTenant.id,
          userId: globexAdmin.id,
        });

      if (globexNoteError) {
        throw globexNoteError;
      }
    }

    console.log("Sample notes created");
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
