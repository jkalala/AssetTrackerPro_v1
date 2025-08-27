import { createClient } from '@/lib/supabase/server'
import { 
  ReportDefinition, 
  ReportTemplate, 
  ReportSchedule, 
  ReportExecution, 
  ExecutiveDashboard,
  ExecutiveInsight,
  AvailableField,
  ReportData,
  ReportQueryBuilder,
  ReportFilter,
  ReportField
} from '@/lib/types/reporting'

export class ReportingService {
  private supabase = createClient()

  // Report Definitions
  async createReportDefinition(
    tenantId: string,
    userId: string,
    data: Omit<ReportDefinition, 'id' | 'tenant_id' | 'created_by' | 'created_at' | 'updated_at'>
  ): Promise<ReportDefinition> {
    const { data: report, error } = await this.supabase
      .from('report_definitions')
      .insert({
        tenant_id: tenantId,
        created_by: userId,
        ...data
      })
      .select()
      .single()

    if (error) throw error
    return report
  }

  async getReportDefinitions(tenantId: string): Promise<ReportDefinition[]> {
    const { data, error } = await this.supabase
      .from('report_definitions')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async getReportDefinition(id: string): Promise<ReportDefinition | null> {
    const { data, error } = await this.supabase
      .from('report_definitions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  }

  async updateReportDefinition(
    id: string,
    updates: Partial<ReportDefinition>
  ): Promise<ReportDefinition> {
    const { data, error } = await this.supabase
      .from('report_definitions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteReportDefinition(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('report_definitions')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
  }

  // Report Templates
  async createReportTemplate(
    tenantId: string,
    userId: string,
    data: Omit<ReportTemplate, 'id' | 'tenant_id' | 'created_by' | 'created_at' | 'updated_at'>
  ): Promise<ReportTemplate> {
    const { data: template, error } = await this.supabase
      .from('report_templates')
      .insert({
        tenant_id: tenantId,
        created_by: userId,
        ...data
      })
      .select()
      .single()

    if (error) throw error
    return template
  }

  async getReportTemplates(tenantId: string): Promise<ReportTemplate[]> {
    const { data, error } = await this.supabase
      .from('report_templates')
      .select('*')
      .or(`tenant_id.eq.${tenantId},is_public.eq.true,tenant_id.is.null`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async getReportTemplate(id: string): Promise<ReportTemplate | null> {
    const { data, error } = await this.supabase
      .from('report_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  }

  // Report Schedules
  async createReportSchedule(
    tenantId: string,
    userId: string,
    data: Omit<ReportSchedule, 'id' | 'tenant_id' | 'created_by' | 'created_at' | 'updated_at' | 'next_run'>
  ): Promise<ReportSchedule> {
    const { data: schedule, error } = await this.supabase
      .from('report_schedules')
      .insert({
        tenant_id: tenantId,
        created_by: userId,
        ...data
      })
      .select()
      .single()

    if (error) throw error
    return schedule
  }

  async getReportSchedules(tenantId: string): Promise<ReportSchedule[]> {
    const { data, error } = await this.supabase
      .from('report_schedules')
      .select(`
        *,
        report_definitions!inner(name, category)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async updateReportSchedule(
    id: string,
    updates: Partial<ReportSchedule>
  ): Promise<ReportSchedule> {
    const { data, error } = await this.supabase
      .from('report_schedules')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Report Executions
  async createReportExecution(
    tenantId: string,
    userId: string,
    data: Omit<ReportExecution, 'id' | 'tenant_id' | 'created_by' | 'created_at'>
  ): Promise<ReportExecution> {
    const { data: execution, error } = await this.supabase
      .from('report_executions')
      .insert({
        tenant_id: tenantId,
        created_by: userId,
        ...data
      })
      .select()
      .single()

    if (error) throw error
    return execution
  }

  async updateReportExecution(
    id: string,
    updates: Partial<ReportExecution>
  ): Promise<ReportExecution> {
    const { data, error } = await this.supabase
      .from('report_executions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getReportExecutions(
    tenantId: string,
    reportId?: string,
    limit: number = 50
  ): Promise<ReportExecution[]> {
    let query = this.supabase
      .from('report_executions')
      .select(`
        *,
        report_definitions!inner(name, category)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (reportId) {
      query = query.eq('report_id', reportId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  // Executive Dashboards
  async createExecutiveDashboard(
    tenantId: string,
    userId: string,
    data: Omit<ExecutiveDashboard, 'id' | 'tenant_id' | 'created_by' | 'created_at' | 'updated_at' | 'insights' | 'kpis' | 'trends' | 'alerts'>
  ): Promise<ExecutiveDashboard> {
    const { data: dashboard, error } = await this.supabase
      .from('executive_dashboards')
      .insert({
        tenant_id: tenantId,
        created_by: userId,
        configuration: {
          ...data,
          insights: [],
          kpis: [],
          trends: [],
          alerts: []
        }
      })
      .select()
      .single()

    if (error) throw error
    return {
      ...dashboard,
      insights: [],
      kpis: [],
      trends: [],
      alerts: []
    }
  }

  async getExecutiveDashboards(tenantId: string): Promise<ExecutiveDashboard[]> {
    const { data, error } = await this.supabase
      .from('executive_dashboards')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    return (data || []).map(dashboard => ({
      ...dashboard,
      insights: dashboard.configuration?.insights || [],
      kpis: dashboard.configuration?.kpis || [],
      trends: dashboard.configuration?.trends || [],
      alerts: dashboard.configuration?.alerts || []
    }))
  }

  async generateExecutiveInsights(tenantId: string): Promise<ExecutiveInsight[]> {
    const { data, error } = await this.supabase
      .rpc('generate_executive_insights', { tenant_uuid: tenantId })

    if (error) throw error
    
    return (data || []).map((insight: any) => ({
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: insight.title,
      description: insight.description,
      type: insight.type,
      priority: insight.priority,
      data: insight.data,
      generated_at: new Date().toISOString()
    }))
  }

  // Available Fields
  async getAvailableFields(tenantId: string): Promise<AvailableField[]> {
    const { data, error } = await this.supabase
      .from('report_available_fields')
      .select('*')
      .or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
      .order('category', { ascending: true })
      .order('display_name', { ascending: true })

    if (error) throw error
    return (data || []).map(field => ({
      id: field.name,
      name: field.display_name,
      type: field.type,
      table: field.table_name,
      column: field.column_name,
      description: field.description,
      category: field.category,
      aggregatable: field.aggregatable,
      filterable: field.filterable,
      sortable: field.sortable
    }))
  }

  // Query Builder and Execution
  async buildQuery(
    fields: ReportField[],
    filters: ReportFilter[],
    sorting: any[],
    grouping: any[],
    limit?: number
  ): Promise<ReportQueryBuilder> {
    const tables = [...new Set(fields.map(f => f.table))]
    const select = fields.map(f => {
      if (f.aggregation) {
        return `${f.aggregation.toUpperCase()}(${f.table}.${f.column}) as ${f.id}`
      }
      return `${f.table}.${f.column} as ${f.id}`
    })

    const where = filters.map(filter => {
      switch (filter.operator) {
        case 'equals':
          return `${filter.field} = '${filter.value}'`
        case 'not_equals':
          return `${filter.field} != '${filter.value}'`
        case 'contains':
          return `${filter.field} ILIKE '%${filter.value}%'`
        case 'greater_than':
          return `${filter.field} > ${filter.value}`
        case 'less_than':
          return `${filter.field} < ${filter.value}`
        case 'between':
          return `${filter.field} BETWEEN ${filter.values?.[0]} AND ${filter.values?.[1]}`
        case 'in':
          return `${filter.field} IN (${filter.values?.map(v => `'${v}'`).join(', ')})`
        default:
          return ''
      }
    }).filter(Boolean)

    const groupBy = grouping.map(g => g.field)
    const orderBy = sorting.map(s => `${s.field} ${s.direction.toUpperCase()}`)

    return {
      tables,
      joins: [], // Will be determined based on table relationships
      select,
      where,
      groupBy,
      having: [],
      orderBy,
      limit,
      offset: 0
    }
  }

  async executeReport(
    tenantId: string,
    reportId: string,
    parameters: Record<string, any> = {}
  ): Promise<ReportData> {
    const startTime = Date.now()
    
    // Get report definition
    const report = await this.getReportDefinition(reportId)
    if (!report) {
      throw new Error('Report not found')
    }

    // Build and execute query based on report definition
    const query = await this.buildQuery(
      report.definition.fields || [],
      report.definition.filters || [],
      report.definition.sorting || [],
      report.definition.grouping || []
    )

    // For now, return mock data - in production this would execute the actual query
    const mockData = await this.generateMockReportData(report)
    
    const executionTime = Date.now() - startTime

    return {
      columns: mockData.columns,
      rows: mockData.rows,
      total_rows: mockData.rows.length,
      execution_time_ms: executionTime,
      generated_at: new Date().toISOString()
    }
  }

  private async generateMockReportData(report: ReportDefinition): Promise<ReportData> {
    // Generate mock data based on report fields
    const columns = (report.definition.fields || []).map(field => ({
      key: field.id,
      name: field.name,
      type: field.type,
      format: field.format
    }))

    const rows = Array.from({ length: 50 }, (_, i) => {
      const row: Record<string, any> = {}
      columns.forEach(col => {
        switch (col.type) {
          case 'string':
            row[col.key] = `Sample ${col.name} ${i + 1}`
            break
          case 'number':
            row[col.key] = Math.floor(Math.random() * 1000) + 1
            break
          case 'date':
            row[col.key] = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            break
          case 'boolean':
            row[col.key] = Math.random() > 0.5
            break
          default:
            row[col.key] = `Value ${i + 1}`
        }
      })
      return row
    })

    return { columns, rows }
  }

  // Export Functions
  async exportReportToPDF(
    reportData: ReportData,
    template?: ReportTemplate
  ): Promise<Buffer> {
    // Mock PDF generation - in production would use a PDF library
    const pdfContent = `PDF Report Generated at ${new Date().toISOString()}\n\nData: ${JSON.stringify(reportData, null, 2)}`
    return Buffer.from(pdfContent, 'utf-8')
  }

  async exportReportToExcel(
    reportData: ReportData,
    template?: ReportTemplate
  ): Promise<Buffer> {
    // Mock Excel generation - in production would use a library like ExcelJS
    const excelContent = `Excel Report Generated at ${new Date().toISOString()}\n\nData: ${JSON.stringify(reportData, null, 2)}`
    return Buffer.from(excelContent, 'utf-8')
  }

  async exportReportToCSV(reportData: ReportData): Promise<string> {
    const headers = reportData.columns.map(col => col.name).join(',')
    const rows = reportData.rows.map(row => 
      reportData.columns.map(col => {
        const value = row[col.key]
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      }).join(',')
    )
    
    return [headers, ...rows].join('\n')
  }

  // Scheduled Reports
  async getScheduledReportsToRun(): Promise<ReportSchedule[]> {
    const { data, error } = await this.supabase
      .from('report_schedules')
      .select(`
        *,
        report_definitions!inner(*)
      `)
      .eq('is_active', true)
      .lte('next_run', new Date().toISOString())

    if (error) throw error
    return data || []
  }

  async processScheduledReport(schedule: ReportSchedule): Promise<void> {
    try {
      // Create execution record
      const execution = await this.createReportExecution(
        schedule.tenant_id,
        schedule.created_by,
        {
          report_id: schedule.report_id,
          schedule_id: schedule.id,
          status: 'running',
          format: schedule.format,
          parameters: schedule.parameters || {}
        }
      )

      // Execute report
      const reportData = await this.executeReport(
        schedule.tenant_id,
        schedule.report_id,
        schedule.parameters || {}
      )

      // Generate file based on format
      let fileBuffer: Buffer
      let fileName: string
      let mimeType: string

      switch (schedule.format) {
        case 'pdf':
          fileBuffer = await this.exportReportToPDF(reportData)
          fileName = `report_${schedule.id}_${Date.now()}.pdf`
          mimeType = 'application/pdf'
          break
        case 'excel':
          fileBuffer = await this.exportReportToExcel(reportData)
          fileName = `report_${schedule.id}_${Date.now()}.xlsx`
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          break
        case 'csv':
          const csvContent = await this.exportReportToCSV(reportData)
          fileBuffer = Buffer.from(csvContent, 'utf-8')
          fileName = `report_${schedule.id}_${Date.now()}.csv`
          mimeType = 'text/csv'
          break
        default:
          throw new Error(`Unsupported format: ${schedule.format}`)
      }

      // Upload file (mock - in production would upload to storage)
      const resultUrl = `https://storage.example.com/reports/${fileName}`

      // Update execution record
      await this.updateReportExecution(execution.id, {
        status: 'completed',
        result_url: resultUrl,
        execution_time_ms: reportData.execution_time_ms,
        row_count: reportData.total_rows,
        file_size_bytes: fileBuffer.length,
        completed_at: new Date().toISOString()
      })

      // Update schedule last_run and next_run
      await this.updateReportSchedule(schedule.id, {
        last_run: new Date().toISOString()
      })

      // Send notifications to recipients (mock)
      console.log(`Report sent to: ${schedule.recipients.join(', ')}`)

    } catch (error) {
      console.error('Error processing scheduled report:', error)
      // Update execution with error
      // This would be implemented in production
    }
  }
}