import { test, expect } from '@playwright/test'

test.describe('API Authentication E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test environment
    await page.goto('/')
  })

  test('should handle API key authentication flow', async ({ page }) => {
    // Mock authentication for admin access
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-admin-token',
        user: { id: 'admin-user', email: 'admin@test.com' }
      }))
    })

    // Navigate to API keys management
    await page.goto('/settings/api-keys')
    
    // Should show API keys management page
    await expect(page.locator('h1')).toContainText('API Keys')
    
    // Create new API key
    await page.click('button:has-text("Create API Key")')
    
    // Fill in API key details
    await page.fill('input[name="keyName"]', 'Test E2E Key')
    await page.check('input[name="permissions.assets.read"]')
    await page.check('input[name="permissions.assets.write"]')
    
    // Submit form
    await page.click('button:has-text("Create Key")')
    
    // Should show success message and API key
    await expect(page.locator('.success-message')).toBeVisible()
    await expect(page.locator('[data-testid="api-key-value"]')).toBeVisible()
    
    // Copy API key for testing
    const apiKeyElement = page.locator('[data-testid="api-key-value"]')
    const apiKey = await apiKeyElement.textContent()
    
    expect(apiKey).toMatch(/^ak_/)
  })

  test('should handle MFA setup flow', async ({ page }) => {
    // Mock authenticated user
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-user-token',
        user: { id: 'test-user', email: 'user@test.com' }
      }))
    })

    // Navigate to security settings
    await page.goto('/settings/security')
    
    // Should show security settings
    await expect(page.locator('h1')).toContainText('Security Settings')
    
    // Enable MFA
    await page.click('button:has-text("Enable Two-Factor Authentication")')
    
    // Should show MFA setup modal
    await expect(page.locator('[data-testid="mfa-setup-modal"]')).toBeVisible()
    
    // Select TOTP method
    await page.click('button:has-text("Authenticator App")')
    
    // Should show QR code and secret
    await expect(page.locator('[data-testid="qr-code"]')).toBeVisible()
    await expect(page.locator('[data-testid="manual-secret"]')).toBeVisible()
    
    // Enter verification code (mock)
    await page.fill('input[name="verificationCode"]', '123456')
    await page.click('button:has-text("Verify and Enable")')
    
    // Should show backup codes
    await expect(page.locator('[data-testid="backup-codes"]')).toBeVisible()
    
    // Confirm backup codes saved
    await page.check('input[name="backupCodesSaved"]')
    await page.click('button:has-text("Complete Setup")')
    
    // Should return to security settings with MFA enabled
    await expect(page.locator('[data-testid="mfa-status"]')).toContainText('Enabled')
  })

  test('should handle session management', async ({ page }) => {
    // Mock authenticated user with multiple sessions
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-user-token',
        user: { id: 'test-user', email: 'user@test.com' }
      }))
    })

    // Navigate to sessions page
    await page.goto('/settings/sessions')
    
    // Should show active sessions
    await expect(page.locator('h1')).toContainText('Active Sessions')
    await expect(page.locator('[data-testid="session-list"]')).toBeVisible()
    
    // Should show current session
    await expect(page.locator('[data-testid="current-session"]')).toBeVisible()
    await expect(page.locator('[data-testid="current-session"]')).toContainText('Current Session')
    
    // Terminate other session
    const otherSessionButton = page.locator('[data-testid="terminate-session"]').first()
    if (await otherSessionButton.isVisible()) {
      await otherSessionButton.click()
      
      // Confirm termination
      await page.click('button:has-text("Terminate Session")')
      
      // Should show success message
      await expect(page.locator('.success-message')).toContainText('Session terminated')
    }
  })

  test('should handle API rate limiting', async ({ page, request }) => {
    // This test would require actual API endpoints to be available
    // For now, we'll test the UI behavior when rate limits are hit
    
    await page.addInitScript(() => {
      // Mock rate limit response
      window.fetch = async (url: RequestInfo | URL, options?: RequestInit) => {
        const urlString = typeof url === 'string' ? url : url.toString()
        const headers = options?.headers as Record<string, string> | undefined
        
        if (urlString.includes('/api/') && headers?.['Authorization']) {
          return new Response(JSON.stringify({
            error: 'Rate limit exceeded',
            retryAfter: 60
          }), {
            status: 429,
            headers: {
              'X-RateLimit-Limit': '100',
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': (Math.floor(Date.now() / 1000) + 60).toString()
            }
          })
        }
        return fetch(url, options)
      }
    })

    await page.goto('/dashboard')
    
    // Trigger API call that would hit rate limit
    await page.click('[data-testid="refresh-data"]')
    
    // Should show rate limit error
    await expect(page.locator('.error-message')).toContainText('Rate limit exceeded')
    await expect(page.locator('.error-message')).toContainText('Try again in')
  })

  test('should handle SSO authentication flow', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')
    
    // Should show SSO options
    await expect(page.locator('button:has-text("Sign in with SAML")')).toBeVisible()
    
    // Click SSO login
    await page.click('button:has-text("Sign in with SAML")')
    
    // Should redirect to SSO provider (mocked)
    await page.waitForURL(/sso-provider\.example\.com/)
    
    // Mock successful SSO response
    await page.addInitScript(() => {
      window.location.href = '/auth/callback?code=mock-sso-code&state=mock-state'
    })
    
    // Should redirect back to application
    await page.waitForURL('/dashboard')
    
    // Should be authenticated
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('should handle security events logging', async ({ page }) => {
    // Mock authenticated admin user
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-admin-token',
        user: { id: 'admin-user', email: 'admin@test.com', role: 'admin' }
      }))
    })

    // Navigate to security events
    await page.goto('/admin/security-events')
    
    // Should show security events log
    await expect(page.locator('h1')).toContainText('Security Events')
    await expect(page.locator('[data-testid="events-table"]')).toBeVisible()
    
    // Should show different event types
    await expect(page.locator('[data-testid="event-type-login_success"]')).toBeVisible()
    await expect(page.locator('[data-testid="event-type-mfa_success"]')).toBeVisible()
    
    // Filter by event type
    await page.selectOption('select[name="eventType"]', 'login_failure')
    await page.click('button:has-text("Filter")')
    
    // Should show filtered results
    await expect(page.locator('[data-testid="events-table"] tbody tr')).toHaveCount(0)
    
    // Reset filter
    await page.selectOption('select[name="eventType"]', 'all')
    await page.click('button:has-text("Filter")')
    
    // Should show all events again
    await expect(page.locator('[data-testid="events-table"] tbody tr')).toHaveCount(3)
  })

  test('should handle tenant isolation', async ({ page }) => {
    // Test that users can only access their tenant's data
    
    // Mock user from tenant A
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-tenant-a-token',
        user: { 
          id: 'user-a', 
          email: 'user-a@tenant-a.com',
          app_metadata: { tenant_id: 'tenant-a' }
        }
      }))
    })

    await page.goto('/dashboard')
    
    // Should only see tenant A's data
    await expect(page.locator('[data-testid="tenant-name"]')).toContainText('Tenant A')
    
    // Try to access tenant B's data directly (should fail)
    await page.goto('/api/assets?tenant_id=tenant-b')
    
    // Should get unauthorized or redirect
    await expect(page.locator('body')).toContainText('Unauthorized')
  })
})