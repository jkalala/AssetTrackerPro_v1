// Centralized Supabase configuration
export const SUPABASE_CONFIG = {
  url: "https://wyqohljdnrouovuqqdlt.supabase.co",
  projectId: "wyqohljdnrouovuqqdlt",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5cW9obGpkbnJvdW92dXFxZGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMzAxOTcsImV4cCI6MjA2NDkwNjE5N30.ZV7V7YB6AujqWqPexZDeqkK0LgfzIpeeDulzXRuFpjg",
  storageUrl: "https://wyqohljdnrouovuqqdlt.supabase.co/storage/v1",
  authUrl: "https://wyqohljdnrouovuqqdlt.supabase.co/auth/v1",
  apiUrl: "https://wyqohljdnrouovuqqdlt.supabase.co/rest/v1",
  dashboardUrl: "https://app.supabase.com/project/wyqohljdnrouovuqqdlt",
  // GitHub OAuth Configuration
  github: {
    clientId: "Ov23lipMb8831rUNvsJR",
    // Note: Client secret should be configured in Supabase dashboard, not exposed here
  },
}

// Helper function to get the correct URL based on environment
export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_CONFIG.url
}

// Helper function to get the correct anon key based on environment
export function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_CONFIG.anonKey
}

// Helper function to get storage URL
export function getStorageUrl(bucket: string, path: string): string {
  return `${SUPABASE_CONFIG.storageUrl}/object/public/${bucket}/${path}`
}

// Helper function to get the correct redirect URL
export function getRedirectUrl(path = ""): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cloudeleavepro.vercel.app"
  return `${baseUrl}${path}`
}
