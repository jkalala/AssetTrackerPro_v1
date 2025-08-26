# Design Document

## Overview

This design addresses the failing E2E authentication tests by implementing missing UI components, pages, and backend functionality. The solution focuses on creating the expected test elements while maintaining security best practices and proper user experience.

## Architecture

The implementation follows a layered architecture:

1. **Presentation Layer**: React components with proper test IDs and accessibility
2. **API Layer**: Next.js API routes for authentication operations
3. **Service Layer**: Business logic for authentication, session management, and security
4. **Data Layer**: Database operations with proper tenant isolation

## Components and Interfaces

### UI Components

#### API Keys Management
- **Location**: `app/settings/api-keys/page.tsx` (enhance existing)
- **Key Elements**:
  - Form with `name="keyName"` input field
  - Permission checkboxes: `name="permissions.assets.read"` and `name="permissions.assets.write"`
  - API key display with `data-testid="api-key-value"`
  - Success message with class `success-message`

#### MFA Setup Modal
- **Location**: `components/auth/mfa-setup-modal.tsx` (new)
- **Key Elements**:
  - Modal container with `data-testid="mfa-setup-modal"`
  - QR code display with `data-testid="qr-code"`
  - Manual secret with `data-testid="manual-secret"`
  - Backup codes display with `data-testid="backup-codes"`
  - Verification code input with `name="verificationCode"`

#### Session Management
- **Location**: `app/settings/sessions/page.tsx` (new)
- **Key Elements**:
  - Session list with `data-testid="session-list"`
  - Current session indicator with `data-testid="current-session"`
  - Terminate buttons with `data-testid="terminate-session"`

#### Security Events Admin
- **Location**: `app/admin/security-events/page.tsx` (new)
- **Key Elements**:
  - Events table with `data-testid="events-table"`
  - Event type indicators with `data-testid="event-type-{type}"`
  - Filter controls with `name="eventType"`

### API Endpoints

#### Enhanced API Keys Endpoint
- **Location**: `app/api/settings/api-keys/route.ts` (enhance existing)
- **Features**:
  - Support for permission-based key creation
  - Proper API key format with "ak_" prefix
  - Permission validation and storage

#### MFA Management Endpoints
- **Location**: `app/api/auth/mfa/` (enhance existing)
- **Endpoints**:
  - `POST /api/auth/mfa/setup` - Initialize MFA setup
  - `POST /api/auth/mfa/verify` - Verify TOTP code
  - `GET /api/auth/mfa/status` - Get MFA status
  - `POST /api/auth/mfa/backup-codes` - Generate backup codes

#### Session Management Endpoints
- **Location**: `app/api/auth/sessions/` (enhance existing)
- **Endpoints**:
  - `GET /api/auth/sessions` - List active sessions
  - `DELETE /api/auth/sessions/:id` - Terminate specific session

#### Security Events Endpoint
- **Location**: `app/api/admin/security-events/route.ts` (new)
- **Features**:
  - Event logging and retrieval
  - Filtering by event type
  - Admin-only access control

### Services

#### MFA Service
- **Location**: `lib/services/mfa-service.ts` (enhance existing)
- **Functions**:
  - `generateTOTPSecret()` - Create TOTP secret
  - `generateQRCode(secret, email)` - Generate QR code
  - `verifyTOTP(secret, token)` - Verify TOTP token
  - `generateBackupCodes()` - Create backup codes

#### Session Service
- **Location**: `lib/services/session-service.ts` (enhance existing)
- **Functions**:
  - `getActiveSessions(userId)` - List user sessions
  - `terminateSession(sessionId)` - End specific session
  - `getCurrentSession(userId)` - Get current session info

#### Security Event Service
- **Location**: `lib/services/security-event-service.ts` (new)
- **Functions**:
  - `logSecurityEvent(type, userId, metadata)` - Log security events
  - `getSecurityEvents(filters)` - Retrieve filtered events
  - `getEventTypes()` - List available event types

## Data Models

### API Key Model (Enhanced)
```typescript
interface ApiKey {
  id: string;
  name: string;
  key_hash: string;
  permissions: {
    assets: {
      read: boolean;
      write: boolean;
    };
  };
  created_at: string;
  revoked: boolean;
  user_id: string;
  tenant_id: string;
}
```

### MFA Configuration Model
```typescript
interface MFAConfig {
  id: string;
  user_id: string;
  secret: string;
  enabled: boolean;
  backup_codes: string[];
  created_at: string;
  verified_at?: string;
}
```

### Session Model
```typescript
interface UserSession {
  id: string;
  user_id: string;
  device_info: string;
  ip_address: string;
  created_at: string;
  last_activity: string;
  is_current: boolean;
}
```

### Security Event Model
```typescript
interface SecurityEvent {
  id: string;
  event_type: 'login_success' | 'login_failure' | 'mfa_success' | 'mfa_failure' | 'api_key_created' | 'session_terminated';
  user_id?: string;
  ip_address: string;
  user_agent: string;
  metadata: Record<string, any>;
  created_at: string;
  tenant_id?: string;
}
```

## Error Handling

### Rate Limiting
- Return HTTP 429 with proper headers
- Include retry-after information
- Display user-friendly error messages
- Implement exponential backoff on client side

### Authentication Errors
- Proper error messages for invalid credentials
- MFA verification failure handling
- Session timeout management
- Tenant isolation violation responses

### Validation Errors
- Input validation for all forms
- API key permission validation
- MFA setup validation
- Session management validation

## Testing Strategy

### Unit Tests
- Service layer functions
- API endpoint handlers
- Component rendering and interactions
- Error handling scenarios

### Integration Tests
- API key creation and management flow
- MFA setup and verification process
- Session management operations
- Security event logging

### E2E Test Alignment
- Ensure all test selectors are implemented
- Match expected UI behavior exactly
- Implement proper loading states
- Handle async operations correctly

## Security Considerations

### API Key Security
- Hash API keys in database
- Use cryptographically secure random generation
- Implement proper permission checking
- Rate limit API key operations

### MFA Security
- Use industry-standard TOTP implementation
- Secure backup code generation and storage
- Proper secret key management
- Time-based validation windows

### Session Security
- Secure session token generation
- Proper session invalidation
- Device fingerprinting for security
- IP address tracking and validation

### Tenant Isolation
- Row-level security policies
- API-level tenant validation
- UI-level data filtering
- Audit trail for cross-tenant access attempts

## Implementation Phases

### Phase 1: Core UI Components
1. Enhance API keys page with test IDs and permissions
2. Create MFA setup modal component
3. Build session management page
4. Add security events admin page

### Phase 2: Backend Services
1. Enhance MFA service with TOTP and backup codes
2. Implement session management service
3. Create security event logging service
4. Add rate limiting middleware

### Phase 3: API Endpoints
1. Enhance API keys endpoint with permissions
2. Complete MFA management endpoints
3. Implement session management endpoints
4. Create security events admin endpoint

### Phase 4: Integration and Testing
1. Wire up all components with services
2. Implement proper error handling
3. Add loading states and user feedback
4. Ensure E2E test compatibility