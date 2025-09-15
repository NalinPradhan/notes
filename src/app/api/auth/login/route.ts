import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { generateToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Define types for Tenant
interface Tenant {
  id: string;
  name: string;
  slug: string;
  subscriptionPlan: string;
}

// Define types for User with Tenant relation
interface UserWithTenant {
  id: string;
  email: string;
  password: string;
  role: string;
  tenantId: string;
  tenant: Tenant;
}

export async function POST(req: NextRequest) {
  console.log("Login attempt started");
  const startTime = Date.now();

  try {
    const body = await req.json();
    const { email, password } = body;

    console.log(`Login attempt for email: ${email}`);

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Log environment variables (only existence, not values)
    console.log("Environment check:", {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV,
    });

    // Verify that Supabase client is properly initialized
    if (!supabaseAdmin) {
      console.error("Supabase admin client is not initialized");
      return NextResponse.json(
        { error: "Database connection error" },
        { status: 500 }
      );
    }

    // Enhanced error handling and logging for Supabase query
    try {
      console.log("Attempting to query user from Supabase");

      // Check if we have a proper Supabase client
      const supabaseClient = supabaseAdmin as unknown as SupabaseClient;
      const isValidClient = typeof supabaseClient.from === "function";

      // Create a timeout promise to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Database query timed out after 5 seconds"));
        }, 5000); // 5 second timeout
      });

      if (!isValidClient) {
        console.error("Invalid Supabase client - trying to reinitialize");

        // Try to directly create a client as a last resort
        if (
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.SUPABASE_SERVICE_KEY
        ) {
          console.log("Creating direct Supabase client with service key");
          const directClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY,
            {
              auth: {
                persistSession: false,
                autoRefreshToken: false,
              },
            }
          );

          console.log("Querying user with direct client");
          // Use race to implement timeout
          const userQuery = directClient
            .from("User")
            .select("*, tenant:Tenant(*)")
            .eq("email", email)
            .single();

          const { data: user, error: userError } = (await Promise.race([
            userQuery,
            timeoutPromise.then(() => {
              throw new Error("User query timed out");
            }),
          ])) as any;

          // Handle query results
          if (userError) {
            console.error("User query error:", userError);
            return NextResponse.json(
              { error: "Invalid email or password" },
              { status: 401 }
            );
          }

          if (!user) {
            console.log("No user found with the provided email");
            return NextResponse.json(
              { error: "Invalid email or password" },
              { status: 401 }
            );
          }

          console.log("Comparing password");
          const passwordMatch = await bcrypt.compare(password, user.password);
          if (!passwordMatch) {
            return NextResponse.json(
              { error: "Invalid email or password" },
              { status: 401 }
            );
          }

          console.log("Password verified, generating token");
          const token = generateToken(user.id);

          const elapsedMs = Date.now() - startTime;
          console.log(`Login successful in ${elapsedMs}ms`);

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
        }

        console.error("Cannot create direct client - missing credentials");
        return NextResponse.json(
          { error: "Authentication service unavailable" },
          { status: 500 }
        );
      }

      console.log("Using existing Supabase client");
      // Get user from Supabase with the normal client - with timeout
      const userQuery = supabaseClient
        .from("User")
        .select("*, tenant:Tenant(*)")
        .eq("email", email)
        .single();

      const { data, error: userError } = (await Promise.race([
        userQuery,
        timeoutPromise.then(() => {
          throw new Error("User query timed out");
        }),
      ])) as any;

      // Handle Supabase query errors
      if (userError) {
        console.error("Supabase query error:", userError);
        return NextResponse.json(
          { error: "Authentication failed" },
          { status: 401 }
        );
      }

      // Cast the data to our defined type
      const user = data as UserWithTenant;

      // Handle user not found or invalid password
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      // Generate JWT token
      const token = generateToken(user.id);

      // Return user data and token
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
    } catch (queryError) {
      console.error("Error during Supabase user query:", queryError);
      return NextResponse.json(
        { error: "Authentication service unavailable" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
