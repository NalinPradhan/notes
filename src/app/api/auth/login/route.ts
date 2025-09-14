import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { generateToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Get user from Supabase
    const { data: user, error: userError } = await supabaseAdmin
      .from("User")
      .select("*, tenant:Tenant(*)")
      .eq("email", email)
      .single();

    if (
      userError ||
      !user ||
      !(await bcrypt.compare(password, user.password))
    ) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = generateToken(user.id);

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        tenantSlug: user.tenant.slug,
        tenantName: user.tenant.name,
        tenantPlan: user.tenant.subscriptionPlan,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
