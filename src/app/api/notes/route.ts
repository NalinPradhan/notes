import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/notes - Get all notes for the current tenant
async function getNotes(req: NextRequest, user: AuthUser) {
  try {
    // Get notes for the current tenant using Supabase
    const { data: notes, error } = await supabaseAdmin
      .from("Note")
      .select("*")
      .eq("tenantId", user.tenantId)
      .order("createdAt", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ notes });
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

    // Check subscription limit for free tier
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("Tenant")
      .select("subscriptionPlan")
      .eq("id", user.tenantId)
      .single();

    if (tenantError) {
      throw tenantError;
    }

    // Count existing notes
    const { count, error: countError } = await supabaseAdmin
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
    const { data: note, error } = await supabaseAdmin
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
