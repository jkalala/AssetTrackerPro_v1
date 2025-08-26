// =====================================================
// SERVICE IMPORTS TESTS
// =====================================================
// Tests to ensure services can be imported and instantiated

describe('Service Imports', () => {
  it('should import MfaService', async () => {
    const { MfaService } = await import('@/lib/services/mfa-service')
    expect(MfaService).toBeDefined()
    
    const service = new MfaService()
    expect(service).toBeInstanceOf(MfaService)
    expect(service.generateTOTPSecret).toBeDefined()
    expect(service.validateTOTPToken).toBeDefined()
  })

  it('should import SsoService', async () => {
    const { SsoService } = await import('@/lib/services/sso-service')
    expect(SsoService).toBeDefined()
    
    const service = new SsoService()
    expect(service).toBeInstanceOf(SsoService)
  })

  it('should import RoleService', async () => {
    const { RoleService } = await import('@/lib/services/role-service')
    expect(RoleService).toBeDefined()
    
    const service = new RoleService()
    expect(service).toBeInstanceOf(RoleService)
  })

  it('should import PermissionService', async () => {
    const { PermissionService } = await import('@/lib/services/permission-service')
    expect(PermissionService).toBeDefined()
    
    const service = new PermissionService()
    expect(service).toBeInstanceOf(PermissionService)
  })

  it('should import DepartmentService', async () => {
    const { DepartmentService } = await import('@/lib/services/department-service')
    expect(DepartmentService).toBeDefined()
    
    const service = new DepartmentService()
    expect(service).toBeInstanceOf(DepartmentService)
  })

  it('should import DelegationService', async () => {
    const { DelegationService } = await import('@/lib/services/delegation-service')
    expect(DelegationService).toBeDefined()
    
    const service = new DelegationService()
    expect(service).toBeInstanceOf(DelegationService)
  })

  it('should import SessionService', async () => {
    const { SessionService } = await import('@/lib/services/session-service')
    expect(SessionService).toBeDefined()
    
    const service = new SessionService()
    expect(service).toBeInstanceOf(SessionService)
  })

  it('should import ApiKeyService', async () => {
    const { ApiKeyService } = await import('@/lib/services/api-key-service')
    expect(ApiKeyService).toBeDefined()
    
    const service = new ApiKeyService()
    expect(service).toBeInstanceOf(ApiKeyService)
  })
})