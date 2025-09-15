import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Create a timeout promise for database operations
const createTimeout = (ms: number, message: string) =>
  new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });

// GET /api/notes - Get all notes for the current tenant
async function getNotes(req: NextRequest, user: AuthUser) {
  try {
    // Verify that Supabase client is properly initialized
    if (!supabaseAdmin) {
      console.error("Supabase admin client is not initialized");
      return NextResponse.json(
        { error: "Database connection error" },
        { status: 500 }
      );
    }

    try {
      // Type cast to SupabaseClient for proper typing
      const supabaseClient = supabaseAdmin as unknown as SupabaseClient;

      // Validate client has required methods
      if (typeof supabaseClient.from !== "function") {
        console.error("Invalid Supabase client in getNotes");

        // Try direct client as fallback
        if (
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.SUPABASE_SERVICE_KEY
        ) {
          const directClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
          );

          // Get notes with direct client
          const { data: notes, error } = await directClient
            .from("Note")
            .select("*")
            .eq("tenantId", user.tenantId)
            .order("createdAt", { ascending: false });

          if (error) {
            throw error;
          }

          return NextResponse.json({ notes });
        }

        return NextResponse.json(
          { error: "Database service unavailable" },
          { status: 503 }
        );
      }

      // Get notes for the current tenant using the properly typed client
      const { data: notes, error } = await supabaseClient
        .from("Note")
        .select("*")
        .eq("tenantId", user.tenantId)
        .order("createdAt", { ascending: false });

      if (error) {
        throw error;
      }

      return NextResponse.json({ notes });
    } catch (supabaseError) {
      console.error("Supabase operation failed:", supabaseError);
      return NextResponse.json(
        { error: "Database operation failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

// POST /api/notes - Create a new note
async function createNote(req: NextRequest, user: AuthUser) {
  try {
    const body = await req.json();
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Verify that Supabase client is properly initialized
    if (!supabaseAdmin) {
      console.error("Supabase admin client is not initialized");
      return NextResponse.json(
        { error: "Database connection error" },
        { status: 500 }
      );
    }

    try {
      // Type cast to SupabaseClient for proper typing
      const supabaseClient = supabaseAdmin as unknown as SupabaseClient;

      // Validate client has required methods
      if (typeof supabaseClient.from !== "function") {
        console.error("Invalid Supabase client in createNote");

        // Try direct client as fallback
        if (
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.SUPABASE_SERVICE_KEY
        ) {
          const directClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
          );

          // Check subscription using direct client
          const { data: tenant, error: tenantError } = await directClient
            .from("Tenant")
            .select("subscriptionPlan")
            .eq("id", user.tenantId)
            .single();

          if (tenantError) {
            throw tenantError;
          }

          // Count notes using direct client
          const { count, error: countError } = await directClient
            .from("Note")
            .select("*", { count: "exact", head: true })
            .eq("tenantId", user.tenantId);

          if (countError) {
            throw countError;
          }

          if (tenant.subscriptionPlan === "FREE" && count! >= 3) {
            return NextResponse.json(
              {
                error: "Free plan limit reached",
                code: "SUBSCRIPTION_LIMIT",
              },
              { status: 403 }
            );
          }

          // Create note using direct client
          const { data: note, error } = await directClient
            .from("Note")
            .insert({
              title,
              content,
              tenantId: user.tenantId,
              userId: user.id,
            })
            .select()
            .single();

          if (error) {
            throw error;
          }

          return NextResponse.json({ note }, { status: 201 });
        }

        return NextResponse.json(
          { error: "Database service unavailable" },
          { status: 503 }
        );
      }

      // Check subscription limit for free tier using properly typed client
      const { data: tenant, error: tenantError } = await supabaseClient
        .from("Tenant")
        .select("subscriptionPlan")
        .eq("id", user.tenantId)
        .single();

      if (tenantError) {
        throw tenantError;
      }

      // Count existing notes
      const { count, error: countError } = await supabaseClient
        .from("Note")
        .select("*", { count: "exact", head: true })
        .eq("tenantId", user.tenantId);

      if (countError) {
        throw countError;
      }

      if (tenant.subscriptionPlan === "FREE" && count! >= 3) {
        return NextResponse.json(
          {
            error: "Free plan limit reached",
            code: "SUBSCRIPTION_LIMIT",
          },
          { status: 403 }
        );
      }

      // Create new note
      const { data: note, error } = await supabaseClient
        .from("Note")
        .insert({
          title,
          content,
          tenantId: user.tenantId,
          userId: user.id,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({ note }, { status: 201 });
    } catch (supabaseError) {
      console.error("Supabase operation failed:", supabaseError);
      return NextResponse.json(
        { error: "Database operation failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getNotes);
export const POST = withAuth(createNote);
