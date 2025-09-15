import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "./supabase";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// User object returned from Supabase
interface UserWithTenant {
  id: string;
  email: string;
  role: string;
  tenantId: string;
  tenant: {
    slug: string;
  };
}

// Auth user interface used throughout the app
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

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
      };
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError);
      return null;
    }

    // Get Supabase client
    const supabaseClient = supabaseAdmin as unknown as SupabaseClient;

    // Check if we have a valid Supabase client
    if (!supabaseClient || typeof supabaseClient.from !== "function") {
      console.error("Invalid Supabase client in verifyAuth");

      // Try to create a direct client as fallback
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.SUPABASE_SERVICE_KEY
      ) {
        const directClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_KEY
        );

        // Query user with direct client
        const { data: user, error } = await directClient
          .from("User")
          .select("*, tenant:Tenant(slug)")
          .eq("id", decoded.userId)
          .single();

        if (error || !user) {
          console.error("Failed to fetch user with direct client:", error);
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          tenantSlug: user.tenant.slug,
        };
      }

      return null;
    }

    // Query user with regular client
    const { data, error } = await supabaseClient
      .from("User")
      .select("*, tenant:Tenant(slug)")
      .eq("id", decoded.userId)
      .single();

    if (error) {
      console.error("Error fetching user data:", error);
      return null;
    }

    if (!data) {
      console.error("No user found with id:", decoded.userId);
      return null;
    }

    const user = data as UserWithTenant;

    // Return authenticated user
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
