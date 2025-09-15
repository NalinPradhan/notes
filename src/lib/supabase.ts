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

// Log environment info for debugging
const logEnvironmentInfo = () => {
  // Never log full credentials, just check if they exist
  console.log("Environment state:", {
    isServer: typeof window === "undefined",
    nodeEnv: process.env.NODE_ENV,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
    publicRuntimeConfig:
      typeof process.env.NEXT_PUBLIC_RUNTIME_ENV !== "undefined",
  });
};

// Only log in development or if explicitly requested
if (
  process.env.NODE_ENV !== "production" ||
  process.env.DEBUG_SUPABASE === "true"
) {
  logEnvironmentInfo();
}

// Determine if we're in build time vs runtime
const isBuildTimeEnvironment =
  // Check if we're in Node.js environment (server-side)
  typeof window === "undefined" &&
  // Either explicitly marked as build environment
  (process.env.NEXT_PUBLIC_RUNTIME_ENV === "build" ||
    // Or missing critical environment variables
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Create a real or dummy client based on environment
const createSafeClient = (url?: string, key?: string) => {
  // Check if we're missing critical values
  const missingCredentials = !url || !key || url === "" || key === "";

  // Log detailed info about client creation
  if (
    process.env.NODE_ENV !== "production" ||
    process.env.DEBUG_SUPABASE === "true"
  ) {
    console.log("Creating Supabase client:", {
      isBuildTime: isBuildTimeEnvironment,
      missingCredentials,
      environment: process.env.NODE_ENV,
      urlExists: !!url,
      keyExists: !!key,
    });
  }

  // During build time or missing credentials, use the dummy client
  if (isBuildTimeEnvironment || missingCredentials) {
    console.log(
      "Using dummy Supabase client - CREDENTIALS MISSING OR BUILD TIME"
    );
    return createDummyClient();
  }

  // For normal runtime with credentials, create a real client
  try {
    // Create client with timeout options to prevent hanging
    console.log("Creating real Supabase client with actual credentials");
    return createClient(url, key, {
      auth: {
        persistSession: false, // Don't persist auth state to prevent stale states
        autoRefreshToken: false, // Manually handle token refresh to avoid hanging
        detectSessionInUrl: false, // Don't auto detect in URL to reduce complexity
      },
      global: {
        fetch: async (input, init) => {
          // Create a timeout to abort long-running requests
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            controller.abort();
            console.error("Supabase fetch operation timed out after 10s");
          }, 10000); // 10 second timeout

          try {
            const response = await fetch(input, {
              ...init,
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response;
          } catch (error) {
            clearTimeout(timeoutId);
            throw error;
          }
        },
      },
    });
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
