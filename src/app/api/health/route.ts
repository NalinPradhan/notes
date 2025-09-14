import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Ping Supabase to check connection
    // Use underscore for unused variable
    const { error } = await supabase.from("Tenant").select("id").limit(1);

    if (error) {
      console.error("Health check database error:", error);
      return NextResponse.json({
        status: "degraded",
        message: "Database connection issue",
      });
    }

    // Even if there's no data, as long as we get a response back without a connection error
    return NextResponse.json({ status: "ok" });
  } catch (error: unknown) {
    console.error("Health check failed:", error);
    // Return degraded status
    return NextResponse.json({
      status: "degraded",
      message: "Service error",
    });
  }
}
