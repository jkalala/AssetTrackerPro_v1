# Implementation Plan

- [x] 1. Enhance API Keys page with test elements and permissions


  - Add proper test IDs and form elements expected by E2E tests
  - Implement permission checkboxes for assets read/write operations
  - Add success message display with proper CSS class
  - Ensure API key display has correct data-testid attribute
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 2. Enhance API Keys backend service and endpoint


  - Modify API key generation to use "ak_" prefix format
  - Add permission storage and validation in database
  - Update API key creation endpoint to handle permissions
  - Implement proper API key hashing and security
  - _Requirements: 1.3, 1.4, 1.6_

- [x] 3. Create MFA setup modal component


  - Build modal component with proper test IDs for E2E tests
  - Implement QR code generation and display
  - Add manual secret display functionality
  - Create backup codes display section
  - Add verification code input and validation
  - _Requirements: 2.2, 2.3, 2.4_

- [x] 4. Enhance MFA service with TOTP functionality

  - Implement TOTP secret generation using industry standards
  - Add QR code generation for authenticator apps
  - Create backup codes generation and validation
  - Add TOTP token verification functionality
  - _Requirements: 2.3, 2.4, 2.6_

- [x] 5. Update security settings page with MFA integration

  - Add "Enable Two-Factor Authentication" button
  - Integrate MFA setup modal with security settings
  - Display MFA status with proper test ID
  - Handle MFA setup completion flow
  - _Requirements: 2.1, 2.2, 2.5_

- [x] 6. Create session management page




  - Build new sessions page at /settings/sessions route
  - Display active sessions list with proper test IDs
  - Highlight current session with special indicator
  - Add session termination functionality with confirmation
  - Show success messages for session operations
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 7. Implement session management service



  - Create service to track and manage user sessions
  - Add functionality to list active sessions for a user
  - Implement session termination with proper cleanup
  - Add current session identification logic
  - _Requirements: 3.2, 3.3, 3.4, 3.6_

- [x] 8. Add rate limiting middleware and UI handling


  - Implement rate limiting middleware with proper HTTP headers
  - Add rate limit error handling in API responses
  - Create UI components to display rate limit errors
  - Add retry logic and user feedback for rate limits
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 9. Enhance login page with SSO support








  - Add "Sign in with SAML" button to login page
  - Implement SSO redirect functionality
  - Create SSO callback handler at /auth/callback
  - Add user menu display with proper test ID after authentication
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 10. Create security events admin page





  - Build new admin page at /admin/security-events route
  - Display security events table with proper test IDs
  - Add event type filtering functionality
  - Implement event type indicators with dynamic test IDs
  - Add admin-only access control
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 11. Implement security event logging service




  - Create service to log various security events
  - Add event types for login, MFA, and other security actions
  - Implement event filtering and retrieval functionality
  - Add proper event metadata storage
  - _Requirements: 6.2, 6.3, 6.6_

- [x] 12. Add tenant isolation and context display





  - Display tenant name on dashboard with proper test ID
  - Implement tenant-based data filtering in API endpoints
  - Add unauthorized access handling for cross-tenant requests
  - Ensure tenant context is maintained throughout user session
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 13. Create database migrations for new functionality








  - Add MFA configuration table and fields
  - Create session tracking table
  - Add security events logging table
  - Update API keys table with permissions column
  - Add tenant isolation constraints
  - _Requirements: 2.6, 3.6, 6.6, 1.6, 7.6_




- [x] 14. Add comprehensive error handling and loading states





  - Implement proper error boundaries for all new components
  - Add loading states for async operations
  - Create user-friendly error messages
  - Add proper form validation and feedback
  - _Requirements: 4.2, 4.3, 2.4, 3.5_

- [x] 15. Write unit tests for new services and components





  - Test MFA service TOTP generation and verification
  - Test session management service operations
  - Test security event logging functionality
  - Test API key permission validation
  - Test tenant isolation enforcement
  - _Requirements: 2.6, 3.6, 6.6, 1.6, 7.6_