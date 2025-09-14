import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "./supabase";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  tenantId: string;
  tenantSlug: string;
}

export async function verifyAuth(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
    };

    const { data: user, error } = await supabaseAdmin
      .from("User")
      .select("*, tenant:Tenant(slug)")
      .eq("id", decoded.userId)
      .single();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      tenantSlug: user.tenant.slug,
    };
  } catch (error) {
    console.error("Auth verification error:", error);
    return null;
  }
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "24h" });
}

export function withAuth(
  handler: (req: NextRequest, user: AuthUser) => Promise<NextResponse>
) {
  return async function (req: NextRequest): Promise<NextResponse> {
    const user = await verifyAuth(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return handler(req, user);
  };
}

export function withAdminAuth(
  handler: (req: NextRequest, user: AuthUser) => Promise<NextResponse>
) {
  return withAuth(async (req: NextRequest, user: AuthUser) => {
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    return handler(req, user);
  });
}
