import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { companiesService, Company } from '@/services/companiesService'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

// Re-export Company type for components
export type { Company }

export interface CreateCompanyData {
  company_id: string
  company_name: string
}

export interface UpdateCompanyData {
  company_id?: string
  company_name?: string
}

export const useCompanies = () => {
  const { isAuthenticated, isSuperAdmin } = useAuth()

  const {
    data: companies,
    isLoading,
    error,
    refetch
  } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: () => companiesService.getCompanies(),
    enabled: isAuthenticated && isSuperAdmin, // Only super admins can fetch all companies
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })

  return {
    companies: companies || [],
    loading: isLoading,
    error,
    refetch
  }
}

export const useCompany = (companyId: string | null) => {
  const { isAuthenticated } = useAuth()

  const {
    data: company,
    isLoading,
    error,
    refetch
  } = useQuery<Company | null>({
    queryKey: ['company', companyId],
    queryFn: () => companyId ? companiesService.getCompanyByCompanyId(companyId) : null,
    enabled: isAuthenticated && !!companyId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })

  return {
    company,
    loading: isLoading,
    error,
    refetch
  }
}

export const useCreateCompany = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (companyData: CreateCompanyData) => companiesService.createCompany(companyData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      toast({
        title: "Success",
        description: "Company created successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create company",
        variant: "destructive",
      })
    }
  })
}

export const useUpdateCompany = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ companyId, updates }: { companyId: string; updates: UpdateCompanyData }) =>
      companiesService.updateCompany(companyId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      toast({
        title: "Success",
        description: "Company updated successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update company",
        variant: "destructive",
      })
    }
  })
}

export const useDeleteCompany = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (companyId: string) => companiesService.deleteCompany(companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      toast({
        title: "Success",
        description: "Company deleted successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete company",
        variant: "destructive",
      })
    }
  })
}
