"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface CreateProfileData {
  full_name: string
  role?: string
}

export async function createUserProfile(data: CreateProfileData) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error("Error getting user:", userError)
      return { error: "Authentication failed. Please log in again." }
    }

    if (!user) {
      console.error("No user found in session")
      return { error: "You must be logged in to create a profile" }
    }

    console.log("Creating profile for user:", user.id, user.email)

    // Use the server-side function to create the profile
    const { data: result, error: functionError } = await supabase.rpc("create_user_profile", {
      user_id: user.id,
      user_email: user.email!,
      user_full_name: data.full_name || null,
      user_avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      user_role: data.role || "user",
    })

    if (functionError) {
      console.error("Profile creation function error:", functionError)
      return { error: `Failed to create profile: ${functionError.message}` }
    }

    console.log("Profile created successfully:", result)

    // Revalidate pages that depend on profile data
    revalidatePath("/")
    revalidatePath("/add-asset")
    revalidatePath("/profile-setup")
    revalidatePath("/dashboard")

    return { success: true, profile: result }
  } catch (err) {
    console.error("Unexpected error in createUserProfile:", err)
    return { error: "An unexpected error occurred while creating your profile" }
  }
}

export async function checkUserProfile() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error("Error getting user in checkUserProfile:", userError)
      return { error: "Authentication failed. Please log in again." }
    }

    if (!user) {
      console.error("No user found in session during profile check")
      return { error: "You must be logged in" }
    }

    console.log("Checking profile for user:", user.id)

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError && profileError.code === "PGRST116") {
      console.log("No profile found for user:", user.id)
      return { exists: false, user }
    } else if (profileError) {
      console.error("Profile query error:", profileError)
      return { error: profileError.message }
    }

    console.log("Profile found for user:", user.id)
    return { exists: true, profile, user }
  } catch (err) {
    console.error("Unexpected error in checkUserProfile:", err)
    return { error: "Failed to check profile" }
  }
}

export async function updateUserProfile(data: Partial<CreateProfileData>) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: "You must be logged in to update your profile" }
    }

    const { data: profile, error: updateError } = await supabase
      .from("profiles")
      .update(data)
      .eq("id", user.id)
      .select()
      .single()

    if (updateError) {
      console.error("Profile update error:", updateError)
      return { error: `Failed to update profile: ${updateError.message}` }
    }

    // Revalidate pages that depend on profile data
    revalidatePath("/")
    revalidatePath("/dashboard")
    revalidatePath("/profile-setup")

    return { success: true, profile }
  } catch (err) {
    console.error("Unexpected error in updateUserProfile:", err)
    return { error: "An unexpected error occurred while updating your profile" }
  }
}
