/**
 * Compliance Testing Setup for AssetTrackerPro
 * Configures compliance testing for GDPR, SOC 2, FERPA, and other regulations
 */

// Compliance Test Environment
process.env.COMPLIANCE_TEST_MODE = 'true'
process.env.GDPR_COMPLIANCE = 'enabled'
process.env.SOC2_COMPLIANCE = 'enabled'
process.env.FERPA_COMPLIANCE = 'enabled'
process.env.AUDIT_RETENTION_DAYS = '2555' // 7 years

// Compliance Test Utilities
global.complianceTestUtils = {
  // GDPR Compliance Testing
  gdpr: {
    validateDataMinimization: (collectedData, requiredFields) => {
      const collectedFields = Object.keys(collectedData)
      const unnecessaryFields = collectedFields.filter(field => !requiredFields.includes(field))

      expect(unnecessaryFields).toHaveLength(0)
    },

    validateConsentTracking: consentRecord => {
      expect(consentRecord).toHaveProperty('user_id')
      expect(consentRecord).toHaveProperty('consent_type')
      expect(consentRecord).toHaveProperty('granted_at')
      expect(consentRecord).toHaveProperty('ip_address')
      expect(consentRecord).toHaveProperty('user_agent')
      expect(consentRecord.consent_type).toMatch(/^(marketing|analytics|functional|necessary)$/)
    },

    validateDataPortability: (exportedData, userId) => {
      expect(exportedData).toHaveProperty('user_data')
      expect(exportedData).toHaveProperty('assets')
      expect(exportedData).toHaveProperty('audit_logs')
      expect(exportedData.user_data.id).toBe(userId)
      expect(exportedData.format).toBe('JSON')
    },

    validateRightToErasure: deletionRecord => {
      expect(deletionRecord).toHaveProperty('user_id')
      expect(deletionRecord).toHaveProperty('deletion_requested_at')
      expect(deletionRecord).toHaveProperty('deletion_completed_at')
      expect(deletionRecord).toHaveProperty('data_categories_deleted')
      expect(deletionRecord.data_categories_deleted).toContain('personal_data')
    },

    validateDataRetention: (data, retentionPolicy) => {
      const dataAge = Date.now() - new Date(data.created_at).getTime()
      const retentionPeriod = retentionPolicy.retention_days * 24 * 60 * 60 * 1000

      if (dataAge > retentionPeriod && !retentionPolicy.legal_hold) {
        throw new Error(`Data retention policy violated for ${data.id}`)
      }
    },
  },

  // SOC 2 Compliance Testing
  soc2: {
    validateAccessControls: (userAccess, resourceId) => {
      expect(userAccess).toHaveProperty('user_id')
      expect(userAccess).toHaveProperty('resource_id')
      expect(userAccess).toHaveProperty('permissions')
      expect(userAccess).toHaveProperty('granted_by')
      expect(userAccess).toHaveProperty('granted_at')
      expect(userAccess.resource_id).toBe(resourceId)
    },

    validateAuditLogging: auditLog => {
      expect(auditLog).toHaveProperty('event_id')
      expect(auditLog).toHaveProperty('user_id')
      expect(auditLog).toHaveProperty('action')
      expect(auditLog).toHaveProperty('resource_type')
      expect(auditLog).toHaveProperty('resource_id')
      expect(auditLog).toHaveProperty('timestamp')
      expect(auditLog).toHaveProperty('ip_address')
      expect(auditLog).toHaveProperty('user_agent')
      expect(auditLog.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    },

    validateDataEncryption: sensitiveData => {
      // Check that sensitive fields are encrypted
      const sensitiveFields = ['ssn', 'credit_card', 'password', 'api_key']

      sensitiveFields.forEach(field => {
        if (sensitiveData[field]) {
          expect(sensitiveData[field]).not.toMatch(/^\d{3}-\d{2}-\d{4}$/) // SSN pattern
          expect(sensitiveData[field]).not.toMatch(/^\d{4}-\d{4}-\d{4}-\d{4}$/) // CC pattern
          expect(sensitiveData[field]).toMatch(/^[A-Za-z0-9+/=]+$/) // Base64 pattern
        }
      })
    },

    validateChangeManagement: changeRecord => {
      expect(changeRecord).toHaveProperty('change_id')
      expect(changeRecord).toHaveProperty('requested_by')
      expect(changeRecord).toHaveProperty('approved_by')
      expect(changeRecord).toHaveProperty('implemented_by')
      expect(changeRecord).toHaveProperty('change_description')
      expect(changeRecord).toHaveProperty('risk_assessment')
      expect(changeRecord).toHaveProperty('rollback_plan')
    },

    validateIncidentResponse: incidentRecord => {
      expect(incidentRecord).toHaveProperty('incident_id')
      expect(incidentRecord).toHaveProperty('severity')
      expect(incidentRecord).toHaveProperty('detected_at')
      expect(incidentRecord).toHaveProperty('reported_by')
      expect(incidentRecord).toHaveProperty('assigned_to')
      expect(incidentRecord).toHaveProperty('status')
      expect(incidentRecord.severity).toMatch(/^(low|medium|high|critical)$/)
    },
  },

  // FERPA Compliance Testing (for Educational Institutions)
  ferpa: {
    validateEducationalRecords: record => {
      expect(record).toHaveProperty('student_id')
      expect(record).toHaveProperty('record_type')
      expect(record).toHaveProperty('access_level')
      expect(record.access_level).toMatch(/^(public|directory|private|restricted)$/)
    },

    validateParentalConsent: (consentRecord, studentAge) => {
      if (studentAge < 18) {
        expect(consentRecord).toHaveProperty('parent_guardian_id')
        expect(consentRecord).toHaveProperty('consent_granted_at')
        expect(consentRecord).toHaveProperty('consent_method')
      }
    },

    validateDirectoryInformation: directoryInfo => {
      const allowedFields = ['name', 'address', 'phone', 'email', 'enrollment_status']
      const providedFields = Object.keys(directoryInfo)

      providedFields.forEach(field => {
        expect(allowedFields).toContain(field)
      })
    },
  },

  // General Compliance Utilities
  validateDataClassification: data => {
    expect(data).toHaveProperty('classification')
    expect(data.classification).toMatch(/^(public|internal|confidential|restricted)$/)

    if (data.classification === 'restricted') {
      expect(data).toHaveProperty('encryption_status')
      expect(data.encryption_status).toBe('encrypted')
    }
  },

  validateDataLineage: dataLineage => {
    expect(dataLineage).toHaveProperty('source_system')
    expect(dataLineage).toHaveProperty('transformations')
    expect(dataLineage).toHaveProperty('destination_system')
    expect(dataLineage).toHaveProperty('data_quality_checks')
    expect(Array.isArray(dataLineage.transformations)).toBe(true)
  },

  validateBackupCompliance: backupRecord => {
    expect(backupRecord).toHaveProperty('backup_id')
    expect(backupRecord).toHaveProperty('backup_type')
    expect(backupRecord).toHaveProperty('created_at')
    expect(backupRecord).toHaveProperty('encryption_status')
    expect(backupRecord).toHaveProperty('retention_period')
    expect(backupRecord.encryption_status).toBe('encrypted')
  },

  validateDisasterRecovery: drTest => {
    expect(drTest).toHaveProperty('test_id')
    expect(drTest).toHaveProperty('test_type')
    expect(drTest).toHaveProperty('rto_target') // Recovery Time Objective
    expect(drTest).toHaveProperty('rpo_target') // Recovery Point Objective
    expect(drTest).toHaveProperty('actual_rto')
    expect(drTest).toHaveProperty('actual_rpo')
    expect(drTest).toHaveProperty('test_result')
    expect(drTest.test_result).toMatch(/^(passed|failed|partial)$/)
  },

  // Compliance Reporting
  generateComplianceReport: complianceData => {
    return {
      report_id: `compliance_${Date.now()}`,
      generated_at: new Date().toISOString(),
      compliance_frameworks: ['GDPR', 'SOC2', 'FERPA'],
      overall_status: 'compliant',
      findings: complianceData.findings || [],
      recommendations: complianceData.recommendations || [],
      next_review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    }
  },
}

// Mock Compliance Services
jest.mock('@/lib/services/gdpr-service', () => ({
  trackConsent: jest.fn().mockResolvedValue({ success: true }),
  exportUserData: jest.fn().mockResolvedValue({ data: {}, format: 'JSON' }),
  deleteUserData: jest.fn().mockResolvedValue({ success: true }),
  validateDataMinimization: jest.fn().mockResolvedValue(true),
}))

jest.mock('@/lib/services/audit-service', () => ({
  createAuditLog: jest.fn().mockResolvedValue({ success: true }),
  getAuditTrail: jest.fn().mockResolvedValue([]),
  validateAuditIntegrity: jest.fn().mockResolvedValue(true),
  generateAuditReport: jest.fn().mockResolvedValue({}),
}))

jest.mock('@/lib/services/data-retention-service', () => ({
  applyRetentionPolicy: jest.fn().mockResolvedValue({ success: true }),
  scheduleDataDeletion: jest.fn().mockResolvedValue({ success: true }),
  validateRetentionCompliance: jest.fn().mockResolvedValue(true),
}))

// Compliance Test Matchers
expect.extend({
  toBeGDPRCompliant(received) {
    const requiredFields = ['consent_tracking', 'data_minimization', 'right_to_erasure']
    const hasAllFields = requiredFields.every(field => received[field])

    return {
      message: () => `expected ${received} to be GDPR compliant`,
      pass: hasAllFields,
    }
  },

  toBeSOC2Compliant(received) {
    const requiredControls = ['access_control', 'audit_logging', 'encryption', 'change_management']
    const hasAllControls = requiredControls.every(control => received[control])

    return {
      message: () => `expected ${received} to be SOC 2 compliant`,
      pass: hasAllControls,
    }
  },

  toHaveValidAuditTrail(received) {
    const pass =
      received &&
      Array.isArray(received) &&
      received.every(log => log.timestamp && log.user_id && log.action && log.resource_type)

    return {
      message: () => `expected ${received} to have a valid audit trail`,
      pass,
    }
  },
})

export default global.complianceTestUtils
