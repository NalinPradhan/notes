import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

interface Note {
  id: string;
  title: string;
  content: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

// Helper function to check if a note belongs to the tenant
async function getNoteWithTenantCheck(id: string, tenantId: string) {
  // Check if Supabase client exists
  if (!supabaseAdmin) {
    console.error("Supabase admin client is not initialized");
    return null;
  }

  try {
    // Type cast to SupabaseClient to get proper typing
    const supabaseClient = supabaseAdmin as unknown as SupabaseClient;

    // Check if client is properly initialized with required methods
    if (typeof supabaseClient.from !== "function") {
      console.error("Invalid Supabase client - from() is not a function");

      // Try to create a direct client as fallback
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.SUPABASE_SERVICE_KEY
      ) {
        console.log("Creating direct Supabase client as fallback");
        const directClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_KEY
        );

        // Query note with direct client
        const { data: note, error } = await directClient
          .from("Note")
          .select("*")
          .eq("id", id)
          .single();

        if (error || !note) {
          console.error("Error fetching note with direct client:", error);
          return null;
        }

        if (note.tenantId !== tenantId) {
          return "unauthorized";
        }

        return note;
      }

      console.error(
        "Failed to create fallback client - missing environment variables"
      );
      return null;
    }

    // Query note with regular client
    const { data: note, error } = await supabaseClient
      .from("Note")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching note:", error);
      return null;
    }

    if (!note) {
      return null;
    }

    if (note.tenantId !== tenantId) {
      return "unauthorized";
    }

    return note as Note;
  } catch (error) {
    console.error("Exception in getNoteWithTenantCheck:", error);
    return null;
  }
}

// GET /api/notes/[id] - Get a specific note
export const GET = withAuth(async (req: NextRequest, user: AuthUser) => {
  const id = req.nextUrl.pathname.split("/").pop() as string;

  const note = await getNoteWithTenantCheck(id, user.tenantId);

  if (note === null) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  if (note === "unauthorized") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  return NextResponse.json({ note });
});

// PUT /api/notes/[id] - Update a note
export const PUT = withAuth(async (req: NextRequest, user: AuthUser) => {
  try {
    const id = req.nextUrl.pathname.split("/").pop() as string;
    const note = await getNoteWithTenantCheck(id, user.tenantId);

    if (note === null) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (note === "unauthorized") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const { title, content } = body;

    if (!title && !content) {
      return NextResponse.json(
        { error: "No updates provided" },
        { status: 400 }
      );
    }

    interface NoteUpdates {
      title?: string;
      content?: string;
    }

    const updates: NoteUpdates = {};
    if (title) updates.title = title;
    if (content) updates.content = content;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Supabase client not initialized" },
        { status: 500 }
      );
    }

    try {
      // Type cast to SupabaseClient for proper typing
      const supabaseClient = supabaseAdmin as unknown as SupabaseClient;

      // Validate client has required methods
      if (typeof supabaseClient.from !== "function") {
        console.error("Invalid Supabase client in PUT handler");

        // Try direct client as fallback
        if (
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.SUPABASE_SERVICE_KEY
        ) {
          const directClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
          );

          // Update note with direct client
          const { data: updatedNote, error } = await directClient
            .from("Note")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

          if (error) {
            throw error;
          }

          return NextResponse.json({ note: updatedNote });
        }

        return NextResponse.json(
          { error: "Database service unavailable" },
          { status: 503 }
        );
      }

      // Update note with regular client
      const { data: updatedNote, error } = await supabaseClient
        .from("Note")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({ note: updatedNote });
    } catch (supabaseError) {
      console.error("Supabase operation failed:", supabaseError);
      return NextResponse.json(
        { error: "Database operation failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 }
    );
  }
});

// DELETE /api/notes/[id] - Delete a note
export const DELETE = withAuth(async (req: NextRequest, user: AuthUser) => {
  try {
    const id = req.nextUrl.pathname.split("/").pop() as string;
    const note = await getNoteWithTenantCheck(id, user.tenantId);

    if (note === null) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (note === "unauthorized") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Supabase client not initialized" },
        { status: 500 }
      );
    }

    try {
      // Type cast to SupabaseClient for proper typing
      const supabaseClient = supabaseAdmin as unknown as SupabaseClient;

      // Validate client has required methods
      if (typeof supabaseClient.from !== "function") {
        console.error("Invalid Supabase client in DELETE handler");

        // Try direct client as fallback
        if (
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.SUPABASE_SERVICE_KEY
        ) {
          const directClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
          );

          // Delete note with direct client
          const { error } = await directClient
            .from("Note")
            .delete()
            .eq("id", id);

          if (error) {
            throw error;
          }

          return NextResponse.json({ message: "Note deleted successfully" });
        }

        return NextResponse.json(
          { error: "Database service unavailable" },
          { status: 503 }
        );
      }

      // Delete note with regular client - correct order is from().delete().eq()
      const { error } = await supabaseClient.from("Note").delete().eq("id", id);

      if (error) {
        throw error;
      }

      return NextResponse.json({ message: "Note deleted successfully" });
    } catch (supabaseError) {
      console.error("Supabase operation failed:", supabaseError);
      return NextResponse.json(
        { error: "Database operation failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }
});
