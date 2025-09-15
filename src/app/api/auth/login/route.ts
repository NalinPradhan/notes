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
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
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

    // Enhanced error handling and logging for Supabase query
    try {
      console.log("Attempting to query user from Supabase");
      
      // Check if we have a proper Supabase client
      const supabaseClient = supabaseAdmin as unknown as SupabaseClient;
      const isValidClient = typeof supabaseClient.from === 'function';
      
      if (!isValidClient) {
        console.error("Invalid Supabase client - trying to reinitialize");
        
        // Try to directly create a client as a last resort
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
          const directClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
          );
          
          const { data: user, error: userError } = await directClient
            .from("User")
            .select("*, tenant:Tenant(*)")
            .eq("email", email)
            .single();
            
          // Handle query results
          if (userError || !user) {
            console.error("User query error:", userError);
            return NextResponse.json(
              { error: "Invalid email or password" },
              { status: 401 }
            );
          }
          
          if (!(await bcrypt.compare(password, user.password))) {
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
        }
        
        return NextResponse.json(
          { error: "Authentication service unavailable" },
          { status: 500 }
        );
      }
      
      // Get user from Supabase with the normal client
      const { data, error: userError } = await supabaseClient
        .from("User")
        .select("*, tenant:Tenant(*)")
        .eq("email", email)
        .single();

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
