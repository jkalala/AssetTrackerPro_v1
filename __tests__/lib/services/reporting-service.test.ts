import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { ReportingService } from '@/lib/services/reporting-service'

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ 
          data: { 
            id: 'test-report-id',
            name: 'Test Report',
            tenant_id: 'test-tenant',
            created_by: 'test-user'
          }, 
          error: null 
        }))
      }))
    })),
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ 
            data: [], 
            error: null 
          }))
        })),
        single: jest.fn(() => Promise.resolve({ 
          data: null, 
          error: null 
        })),
        order: jest.fn(() => Promise.resolve({ 
          data: [], 
          error: null 
        }))
      })),
      or: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({ 
          data: [], 
          error: null 
        }))
      }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: { 
              id: 'test-report-id',
              name: 'Updated Report'
            }, 
            error: null 
          }))
        }))
      }))
    })),
    rpc: jest.fn(() => Promise.resolve({ 
      data: [
        {
          title: 'Test Insight',
          description: 'Test insight description',
          type: 'trend',
          priority: 'medium',
          data: { value: 100 }
        }
      ], 
      error: null 
    }))
  }))
}

// Mock the createClient function
jest.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabaseClient
}))

describe('ReportingService', () => {
  let reportingService: ReportingService

  beforeEach(() => {
    reportingService = new ReportingService()
    jest.clearAllMocks()
  })

  describe('Report Definitions', () => {
    it('should create a report definition', async () => {
      const reportData = {
        name: 'Test Report',
        description: 'Test description',
        category: 'assets',
        fields: [],
        filters: [],
        sorting: [],
        grouping: [],
        visualization: { type: 'table' as const, config: {} },
        is_active: true
      }

      const result = await reportingService.createReportDefinition(
        'test-tenant',
        'test-user',
        reportData
      )

      expect(result).toEqual({
        id: 'test-report-id',
        name: 'Test Report',
        tenant_id: 'test-tenant',
        created_by: 'test-user'
      })

      expect(mockSupabaseClient.from).toHaveBeenCalled()
    })

    it('should get report definitions for a tenant', async () => {
      const result = await reportingService.getReportDefinitions('test-tenant')

      expect(result).toEqual([])
      expect(mockSupabaseClient.from).toHaveBeenCalled()
    })

    it('should update a report definition', async () => {
      const updates = { name: 'Updated Report' }
      
      const result = await reportingService.updateReportDefinition('test-id', updates)

      expect(result).toEqual({
        id: 'test-report-id',
        name: 'Updated Report'
      })

      expect(mockSupabaseClient.from).toHaveBeenCalled()
    })
  })

  describe('Report Templates', () => {
    it('should get report templates for a tenant', async () => {
      const result = await reportingService.getReportTemplates('test-tenant')

      expect(result).toEqual([])
      expect(mockSupabaseClient.from).toHaveBeenCalled()
    })
  })

  describe('Executive Insights', () => {
    it('should generate executive insights', async () => {
      const result = await reportingService.generateExecutiveInsights('test-tenant')

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        title: 'Test Insight',
        description: 'Test insight description',
        type: 'trend',
        priority: 'medium'
      })

      expect(mockSupabaseClient.from).toHaveBeenCalled()
    })
  })

  describe('Report Execution', () => {
    it('should execute a report and return mock data', async () => {
      // Mock the getReportDefinition method
      const mockReport = {
        id: 'test-report',
        name: 'Test Report',
        definition: {
          fields: [
            { id: 'asset_name', name: 'Asset Name', type: 'string', table: 'assets', column: 'name' }
          ],
          filters: [],
          sorting: [],
          grouping: []
        }
      }

      jest.spyOn(reportingService, 'getReportDefinition').mockResolvedValue(mockReport as any)

      const result = await reportingService.executeReport('test-tenant', 'test-report')

      expect(result).toMatchObject({
        columns: expect.any(Array),
        rows: expect.any(Array),
        total_rows: expect.any(Number),
        execution_time_ms: expect.any(Number),
        generated_at: expect.any(String)
      })

      expect(result.columns).toHaveLength(1)
      expect(result.columns[0]).toMatchObject({
        key: 'asset_name',
        name: 'Asset Name',
        type: 'string'
      })

      expect(result.rows).toHaveLength(50) // Mock data generates 50 rows
    })
  })

  describe('Export Functions', () => {
    it('should export report to CSV', async () => {
      const mockData = {
        columns: [
          { key: 'name', name: 'Name', type: 'string' },
          { key: 'value', name: 'Value', type: 'number' }
        ],
        rows: [
          { name: 'Asset 1', value: 100 },
          { name: 'Asset 2', value: 200 }
        ]
      }

      const result = await reportingService.exportReportToCSV(mockData as any)

      expect(result).toContain('Name,Value')
      expect(result).toContain('Asset 1,100')
      expect(result).toContain('Asset 2,200')
    })

    it('should export report to PDF', async () => {
      const mockData = {
        columns: [{ key: 'name', name: 'Name', type: 'string' }],
        rows: [{ name: 'Asset 1' }]
      }

      const result = await reportingService.exportReportToPDF(mockData as any)

      expect(result).toBeInstanceOf(Buffer)
    })

    it('should export report to Excel', async () => {
      const mockData = {
        columns: [{ key: 'name', name: 'Name', type: 'string' }],
        rows: [{ name: 'Asset 1' }]
      }

      const result = await reportingService.exportReportToExcel(mockData as any)

      expect(result).toBeInstanceOf(Buffer)
    })
  })

  describe('Query Builder', () => {
    it('should build a query from report fields and filters', async () => {
      const fields = [
        { id: 'asset_name', name: 'Asset Name', type: 'string', table: 'assets', column: 'name' }
      ]
      const filters = [
        { id: 'filter1', field: 'asset_name', operator: 'contains', value: 'test' }
      ]

      const result = await reportingService.buildQuery(fields as any, filters as any, [], [])

      expect(result).toMatchObject({
        tables: ['assets'],
        select: ['assets.name as asset_name'],
        where: ["asset_name ILIKE '%test%'"],
        groupBy: [],
        having: [],
        orderBy: []
      })
    })
  })
})