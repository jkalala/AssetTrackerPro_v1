"use server"

import { createClient as createClientServer } from "@/lib/supabase/server"
import { createClient as createClientClient } from "@/lib/supabase/client"
import { QRCodeGenerator } from "./qr-code-utils"
import { revalidatePath } from "next/cache"

export async function generateAssetQRCode(assetId: string) {
  try {
    const supabase = await createClientServer()

    // Get the current user session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    console.log("QR Generation: Checking user authentication")
    console.log("User ID:", user?.id)
    console.log("User error:", userError)

    if (userError) {
      console.error("QR Generation: User authentication error:", userError)
      return { error: `Authentication error: ${userError.message}` }
    }

    if (!user) {
      console.error("QR Generation: No user found in session")
      return { error: "You must be logged in to generate QR codes. Please sign in and try again." }
    }

    console.log("QR Generation: User authenticated successfully:", user.id)

    // Get asset data with proper user filtering
    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .select("*")
      .eq("asset_id", assetId)
      .eq("created_by", user.id) // Ensure user owns the asset
      .single()

    console.log("QR Generation: Asset query result:", { asset, assetError })

    if (assetError) {
      console.error("QR Generation: Asset query error:", assetError)
      return { error: `Failed to find asset: ${assetError.message}` }
    }

    if (!asset) {
      return { error: "Asset not found or you don't have permission to access it" }
    }

    console.log("QR Generation: Asset found:", asset.name)

    // Generate QR code
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cloudeleavepro.vercel.app"
    const assetUrl = `${baseUrl}/asset/${asset.asset_id}`

    console.log("QR Generation: Generating QR code for URL:", assetUrl)

    const qrCodeDataURL = await QRCodeGenerator.generateAssetQR({
      assetId: asset.asset_id,
      name: asset._name,
      category: asset.category,
      url: assetUrl,
    })

    console.log("QR Generation: QR code generated successfully")

    // Update asset with QR code public URL
    const { error: updateError } = await supabase
      .from("assets")
      .update({ qr_code: qrCodeDataURL })
      .eq("id", asset.id)
      .eq("created_by", user.id)

    if (updateError) {
      console.error("QR Generation: Update error:", updateError)
      return { error: `Failed to save QR code: ${updateError.message}` }
    }

    console.log("QR Generation: Asset updated with QR code successfully")

    revalidatePath("/")
    revalidatePath("/dashboard")
    revalidatePath("/qr-management")

    return { success: true, qrCode: qrCodeDataURL, assetUrl }
  } catch (_error) {
    console.error("QR generation error:", error)
    return { error: `Failed to generate QR code: ${error instanceof Error ? error.message : "Unknown error"}` }
  }
}

export async function generateBulkQRCodes(assetIds: string[]) {
  try {
    const supabase = await createClientServer()

    // Get the current user session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    console.log("Bulk QR Generation: Checking user authentication")
    console.log("User ID:", user?.id)

    if (userError) {
      console.error("Bulk QR Generation: User authentication error:", userError)
      return { error: `Authentication error: ${userError.message}` }
    }

    if (!user) {
      console.error("Bulk QR Generation: No user found in session")
      return { error: "You must be logged in to generate QR codes. Please sign in and try again." }
    }

    console.log("Bulk QR Generation: User authenticated successfully:", user.id)

    // Get assets data with proper user filtering
    const { data: assets, error: assetsError } = await supabase
      .from("assets")
      .select("*")
      .in("asset_id", assetIds)
      .eq("created_by", user.id) // Ensure user owns the assets

    console.log("Bulk QR Generation: Assets query result:", { assetsCount: assets?.length, assetsError })

    if (assetsError) {
      console.error("Bulk QR Generation: Assets query error:", assetsError)
      return { error: `Failed to fetch assets: ${assetsError.message}` }
    }

    if (!assets || assets.length === 0) {
      return { error: "No assets found or you don't have permission to access them" }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cloudeleavepro.vercel.app"

    // Generate QR codes for all assets
    const assetQRData = assets.map((asset: Record<string, unknown>) => ({
      assetId: asset.asset_id,
      name: asset._name,
      category: asset.category,
      url: `${baseUrl}/asset/${asset.asset_id}`,
    }))

    console.log("Bulk QR Generation: Generating QR codes for", assetQRData.length, "assets")

    const qrResults = await QRCodeGenerator.generateBulkQRCodes(assetQRData as any)

    console.log("Bulk QR Generation: QR codes generated, updating database")

    // Update assets with QR codes
    const updatePromises = qrResults
      .filter((result) => result.success)
      .map((result: Record<string, unknown>) => {
        const asset = assets.find((a: Record<string, unknown>) => a.asset_id === result.assetId)
        if (asset) {
          return supabase.from("assets").update({ qr_code: result.qrCode }).eq("id", asset.id).eq("created_by", user.id) // Ensure user owns the asset
        }
        return null
      })
      .filter(Boolean)

    await Promise.all(updatePromises)

    console.log("Bulk QR Generation: Database updates completed")

    revalidatePath("/")
    revalidatePath("/dashboard")
    revalidatePath("/qr-management")

    return { success: true, results: qrResults }
  } catch (_error) {
    console.error("Bulk QR generation error:", error)
    return { error: `Failed to generate QR codes: ${error instanceof Error ? error.message : "Unknown error"}` }
  }
}

export async function lookupAssetByQR(qrData: string) {
  try {
    const supabase = await createClientServer()

    // Get the current user session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    console.log("QR Lookup: Checking user authentication")
    console.log("User ID:", user?.id)

    if (userError) {
      console.error("QR Lookup: User authentication error:", userError)
      return { error: `Authentication error: ${userError.message}` }
    }

    if (!user) {
      console.error("QR Lookup: No user found in session")
      return { error: "You must be logged in to lookup assets. Please sign in and try again." }
    }

    console.log("QR Lookup: User authenticated successfully:", user.id)

    // Parse QR data
    const assetData = QRCodeGenerator.parseQRData(qrData)
    if (!assetData) {
      return { error: "Invalid QR code format" }
    }

    console.log("QR Lookup: Looking up asset:", assetData.assetId)

    // Look up asset with proper user filtering
    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .select(`
        *,
        assignee:assignee_id(full_name),
        created_by_profile:created_by(full_name)
      `)
      .eq("asset_id", assetData.assetId)
      .eq("created_by", user.id) // Ensure user owns the asset
      .single()

    console.log("QR Lookup: Asset query result:", { asset: asset?._name, assetError })

    if (assetError) {
      console.error("QR Lookup: Asset query error:", assetError)
      return { error: `Failed to find asset: ${assetError.message}` }
    }

    if (!asset) {
      return { error: "Asset not found or you don't have permission to access it" }
    }

    console.log("QR Lookup: Asset found successfully:", asset.name)

    return { success: true, asset, qrData: assetData }
  } catch (_error) {
    console.error("QR lookup error:", error)
    return { error: `Failed to lookup asset: ${error instanceof Error ? error.message : "Unknown error"}` }
  }
}

export async function updateAssetQRCodeUrl(assetId: string, qrCodeUrl: string) {
  try {
    const supabase = await createClientServer()
    // Get the current user session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError) {
      return { error: `Authentication error: ${userError.message}` }
    }
    if (!user) {
      return { error: "You must be logged in to update QR codes. Please sign in and try again." }
    }
    // Update asset with QR code public URL
    const { error: updateError } = await supabase
      .from("assets")
      .update({ qr_code: qrCodeUrl })
      .eq("asset_id", assetId)
      .eq("created_by", user.id)
    if (updateError) {
      return { error: `Failed to save QR code: ${updateError.message}` }
    }
    revalidatePath("/")
    revalidatePath("/dashboard")
    revalidatePath("/qr-management")
    return { success: true }
  } catch (_error) {
    return { error: `Failed to update QR code: ${error instanceof Error ? error.message : "Unknown error"}` }
  }
}
