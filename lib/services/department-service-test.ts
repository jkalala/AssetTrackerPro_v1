// Test file to check if the issue is with the file structure
import { createClient } from '@/lib/supabase/server'

export class DepartmentServiceTest {
  private async getSupabase() {
    return createClient()
  }

  async testMethod(): Promise<void> {
    try {
      const supabase = await this.getSupabase()
      
      const { data } = await supabase
        .from('departments')
        .select('id')
        .limit(1)
      
      console.log(data)
    } catch (error) {
      console.error('Error:', error)
      throw error
    }
  }
}