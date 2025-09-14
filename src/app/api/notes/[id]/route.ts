import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// Helper function to check if a note belongs to the tenant
async function getNoteWithTenantCheck(id: string, tenantId: string) {
  if (!supabaseAdmin) {
    return null;
  }
  const { data: note, error } = await supabaseAdmin
    .from("Note")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !note) {
    return null;
  }

  if (note.tenantId !== tenantId) {
    return "unauthorized";
  }

  return note;
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

    const { data: updatedNote, error } = await supabaseAdmin
      .from("Note")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ note: updatedNote });
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

    const { error } = await supabaseAdmin.from("Note").eq("id", id).delete();

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }
});
