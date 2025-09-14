import { NextResponse } from "next/server";

// Don't import Supabase in health check to prevent build issues
export async function GET() {
  try {
    // Simple health check that doesn't need database connection
    // We can enhance this later once the app is deployed

    // Return success status - database connectivity will be checked at runtime
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    });
  } catch (error: unknown) {
    console.error("Health check failed:", error);
    // Return degraded status
    return NextResponse.json({
      status: "degraded",
      message: "Service error",
    });
  }
}
