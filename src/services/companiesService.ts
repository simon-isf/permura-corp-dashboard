import { supabaseClient, Company } from '@/lib/supabase'

// Re-export Company type for components
export type { Company }

class CompaniesService {
  async getCompanies(): Promise<Company[]> {
    try {
      const { data, error } = await supabaseClient.functions.invoke('admin-companies', {
        method: 'GET'
      })

      if (error) {
        console.error('Error fetching companies:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in getCompanies:', error)
      throw error
    }
  }

  async getCompanyById(id: string): Promise<Company | null> {
    try {
      const { data, error } = await supabaseClient
        .from('companies')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching company:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in getCompanyById:', error)
      throw error
    }
  }

  async getCompanyByCompanyId(companyId: string): Promise<Company | null> {
    try {
      const { data, error } = await supabaseClient
        .from('companies')
        .select('*')
        .eq('company_id', companyId)
        .single()

      if (error) {
        console.error('Error fetching company by company_id:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in getCompanyByCompanyId:', error)
      throw error
    }
  }

  async createCompany(companyData: { company_id: string; company_name: string }): Promise<Company> {
    try {
      const { data, error } = await supabaseClient.functions.invoke('admin-companies', {
        method: 'POST',
        body: companyData
      })

      if (error) {
        console.error('Error creating company:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in createCompany:', error)
      throw error
    }
  }

  async updateCompany(id: string, updates: { company_id?: string; company_name?: string }): Promise<Company> {
    try {
      const { data, error } = await supabaseClient.functions.invoke(`admin-companies?id=${id}`, {
        method: 'PUT',
        body: updates
      })

      if (error) {
        console.error('Error updating company:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in updateCompany:', error)
      throw error
    }
  }

  async deleteCompany(id: string): Promise<void> {
    try {
      const { error } = await supabaseClient.functions.invoke(`admin-companies?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (error) {
        console.error('Error deleting company:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in deleteCompany:', error)
      throw error
    }
  }
}

export const companiesService = new CompaniesService()
