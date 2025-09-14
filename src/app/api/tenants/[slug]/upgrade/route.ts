import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth, AuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const POST = withAdminAuth(async (req: NextRequest, user: AuthUser) => {
  try {
    console.log("Request URL:", req.nextUrl.pathname);
    const pathParts = req.nextUrl.pathname.split("/");
    console.log("Path parts:", pathParts);

    // We need to find the part after /api/tenants/ and before /upgrade
    // Handle the path correctly regardless of exact structure
    let slug;
    const tenantIndex = pathParts.findIndex((part) => part === "tenants");
    if (tenantIndex !== -1 && tenantIndex + 1 < pathParts.length) {
      slug = pathParts[tenantIndex + 1];
    }

    console.log("Extracted slug:", slug);

    if (!slug) {
      return NextResponse.json(
        { error: "Invalid tenant slug" },
        { status: 400 }
      );
    }

    // Verify the user belongs to this tenant
    if (user.tenantSlug !== slug) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Update the tenant subscription
    const { data: tenant, error } = await supabaseAdmin
      .from("Tenant")
      .update({ subscriptionPlan: "PRO" })
      .eq("slug", slug)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      message: "Subscription upgraded successfully",
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        subscriptionPlan: tenant.subscriptionPlan,
      },
    });
  } catch (error) {
    console.error("Error upgrading subscription:", error);
    return NextResponse.json(
      { error: "Failed to upgrade subscription" },
      { status: 500 }
    );
  }
});
