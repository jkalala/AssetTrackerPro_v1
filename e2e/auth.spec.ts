import { test, expect } from "@playwright/test"

test.describe("Authentication", () => {
  test("should display login page", async ({ page }) => {
    await page.goto("/")

    // Should redirect to login if not authenticated
    await expect(page).toHaveTitle(/AssetTracker Pro/)
    await expect(page.locator("text=Sign in")).toBeVisible()
  })

  test("should handle GitHub OAuth flow", async ({ page }) => {
    await page.goto("/")

    // Click GitHub sign in button
    await page.click("text=Sign in with GitHub")

    // Should redirect to GitHub (we'll mock this in actual tests)
    await expect(page).toHaveURL(/github\.com/)
  })
})

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication state
    await page.addInitScript(() => {
      window.localStorage.setItem("supabase.auth.token", "mock-token")
    })
  })

  test("should display dashboard when authenticated", async ({ page }) => {
    await page.goto("/dashboard")

    await expect(page.locator("text=Dashboard")).toBeVisible()
    await expect(page.locator("text=Total Assets")).toBeVisible()
  })
})
