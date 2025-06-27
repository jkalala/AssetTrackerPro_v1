// Environment configuration with validation
export const ENV = {
  // Supabase Configuration
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wyqohljdnrouovuqqdlt.supabase.co",
  SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5cW9obGpkbnJvdW92dXFxZGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMzAxOTcsImV4cCI6MjA2NDkwNjE5N30.ZV7V7YB6AujqWqPexZDeqkK0LgfzIpeeDulzXRuFpjg",

  // App Configuration
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  // Environment
  NODE_ENV: process.env.NODE_ENV || "development",
  IS_PRODUCTION: process.env.NODE_ENV === "production",
  IS_DEVELOPMENT: process.env.NODE_ENV === "development",
}

// Validation function
export function validateEnvironment() {
  const errors: string[] = []

  if (!ENV.SUPABASE_URL || ENV.SUPABASE_URL === "undefined") {
    errors.push("NEXT_PUBLIC_SUPABASE_URL is required")
  }

  if (!ENV.SUPABASE_ANON_KEY || ENV.SUPABASE_ANON_KEY === "undefined") {
    errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is required")
  }

  // Validate URL format
  try {
    new URL(ENV.SUPABASE_URL)
  } catch {
    errors.push("NEXT_PUBLIC_SUPABASE_URL must be a valid URL")
  }

  if (errors.length > 0) {
    console.error("Environment validation errors:", errors)
    return { valid: false, errors }
  }

  return { valid: true, errors: [] }
}

// Log environment status (only in development)
if (ENV.IS_DEVELOPMENT && typeof window !== "undefined") {
  console.log("Environment Configuration:", {
    SUPABASE_URL: ENV.SUPABASE_URL,
    APP_URL: ENV.APP_URL,
    NODE_ENV: ENV.NODE_ENV,
    SUPABASE_ANON_KEY: ENV.SUPABASE_ANON_KEY ? "Set" : "Missing",
  })

  const validation = validateEnvironment()
  if (!validation.valid) {
    console.error("Environment validation failed:", validation.errors)
  } else {
    console.log("✅ Environment validation passed")
  }
}
