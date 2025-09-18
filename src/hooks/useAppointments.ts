import { useQuery } from '@tanstack/react-query'
import { useMemo, useRef, useEffect } from 'react'
import { appointmentsService, AppointmentFilters, AppointmentsResponse } from '@/services/appointmentsService'
import { useAuth } from '@/contexts/AuthContext'
import { detectInfiniteLoop, logFilterChanges } from '@/utils/debugHelpers'

export const useAppointments = (filters: AppointmentFilters = {}) => {
  const { profile, isAuthenticated } = useAuth()
  const renderCount = useRef(0)
  const lastFiltersRef = useRef<string>('')

  // Increment render count (development diagnostics only)
  renderCount.current++
  // Note: Do NOT early-return here; doing so changes hook order and breaks React.

  // Memoize effective filters to prevent unnecessary re-renders
  const effectiveFilters = useMemo(() => {
    const result = {
      ...filters,
      // If user is not super admin and has a company, filter by their company
      selectedCompany: profile?.role === 'super_admin'
        ? filters.selectedCompany
        : profile?.company_id || filters.selectedCompany
    }

    // Log filter changes in development for debugging (reduced logging)
    const filtersString = JSON.stringify(result)
    if (process.env.NODE_ENV === 'development' && lastFiltersRef.current !== filtersString) {
      console.log(`🔄 useAppointments: effectiveFilters updated (render #${renderCount.current})`)
      lastFiltersRef.current = filtersString
    }

    return result
  }, [
    filters.dateRange?.start?.toISOString(),
    filters.dateRange?.end?.toISOString(),
    JSON.stringify(filters.selectedClosers), // Stringify arrays to prevent reference issues
    JSON.stringify(filters.selectedSetters), // Stringify arrays to prevent reference issues
    filters.selectedCompany,
    profile?.role,
    profile?.company_id
  ])

  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
    isStale
  } = useQuery<AppointmentsResponse>({
    queryKey: ['appointments', effectiveFilters],
    queryFn: async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('useAppointments: Fetching appointments with filters', effectiveFilters)
      }

      try {
        const result = await appointmentsService.getAppointments(effectiveFilters)

        if (process.env.NODE_ENV === 'development') {
          console.log('useAppointments: Successfully fetched', result.appointments?.length, 'appointments')
        }

        return result
      } catch (error) {
        console.error('useAppointments: Error fetching appointments', error)
        throw error
      }
    },
    enabled: isAuthenticated && !!profile, // Ensure profile is loaded
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status
        if (status === 401 || status === 403) {
          return false
        }
      }
      return failureCount < 2 // Reduce retry attempts
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })

  // Log only on actual state transitions to reduce noise during loading animations
  const prevStateRef = useRef<{ isLoading: boolean; hasError: boolean } | null>(null)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    const state = { isLoading, hasError: !!error }
    const prev = prevStateRef.current
    if (!prev || prev.isLoading !== state.isLoading || prev.hasError !== state.hasError) {
      console.log('useAppointments: State change', state)
      prevStateRef.current = state
    }
  }, [isLoading, error])

  return {
    appointments: data?.appointments || [],
    metrics: data?.metrics || {
      totalAppointments: 0,
      totalSits: 0,
      totalCloses: 0,
      noShows: 0,
      rescheduled: 0,
      notInterested: 0,
      disqualified: 0,
      followUp: 0,
      pending: 0,
      sitRate: 0,
      closeRate: 0
    },
    uniqueClosers: data?.uniqueClosers || [],
    uniqueSetters: data?.uniqueSetters || [],
    loading: isLoading,
    error: error ? String(error) : null, // Ensure error is serializable
    refetch,
    // Additional debugging info
    isFetching,
    isStale,
    effectiveFilters: process.env.NODE_ENV === 'development' ? effectiveFilters : undefined
  }
}
