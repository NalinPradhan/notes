import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables from .env file when in Node.js environment
if (typeof window === "undefined") {
  dotenv.config();
}

/**
 * This is a special implementation to handle Supabase client creation
 * that properly supports build time vs runtime environment.
 */

// Create a more comprehensive dummy client for build-time use
const createDummyClient = () => {
  // Create a chainable API that matches Supabase's structure
  const createChainable = (
    returns: Record<string, unknown> = { data: null, error: null }
  ) => {
    // Define handler with appropriate types
    const handler: ProxyHandler<Record<string, unknown>> = {
      get: (target: Record<string, unknown>, prop: string | symbol) => {
        // If the property exists on the target and is a string key
        if (typeof prop === "string" && prop in target) {
          return target[prop];
        }

        // Otherwise return a function that returns a new proxy
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        return (_: unknown) => new Proxy({}, handler);
      },
    };

    return new Proxy(returns, handler);
  };

  // Return a dummy client with all the methods we need
  return {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    from: (_tableName: string) => createChainable(),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    rpc: (_functionName: string, _params?: Record<string, unknown>) =>
      createChainable(),
    auth: createChainable({
      signIn: () => createChainable(),
      signOut: () => createChainable(),
      onAuthStateChange: () => ({ data: null, error: null }),
    }),
    storage: createChainable(),
    // Add other Supabase methods as needed
  };
};

// Determine if we're in build time
const isBuildTimeEnvironment =
  typeof window === "undefined" &&
  (!process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Create a real or dummy client based on environment
const createSafeClient = (url?: string, key?: string) => {
  // During build time or missing credentials, use the dummy client
  if (isBuildTimeEnvironment || !url || !key) {
    // Only log during build, not in production runtime
    if (process.env.NODE_ENV !== "production" || isBuildTimeEnvironment) {
      console.log(
        "Using dummy Supabase client (missing credentials or build time)"
      );
    }
    return createDummyClient();
  }

  // For normal runtime with credentials, create a real client
  try {
    return createClient(url, key);
  } catch (error) {
    console.error("Error initializing Supabase client:", error);
    return createDummyClient();
  }
};

// Create clients with improved error handling
export const supabase = createSafeClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Create admin client with improved error handling
export const supabaseAdmin =
  process.env.SUPABASE_SERVICE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL
    ? createSafeClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      )
    : supabase;
