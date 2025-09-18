import { supabaseClient, Appointment, Profile } from '@/lib/supabase'

// Re-export Appointment type for components
export type { Appointment }

export interface AppointmentFilters {
  dateRange?: {
    start: Date
    end: Date
  }
  selectedClosers?: string[]
  selectedSetters?: string[]
  selectedCompany?: string
}

export interface AppointmentMetrics {
  totalAppointments: number
  totalSits: number
  totalCloses: number
  noShows: number
  rescheduled: number
  notInterested: number
  disqualified: number
  followUp: number
  pending: number
  sitRate: number
  closeRate: number
}

export interface AppointmentsResponse {
  appointments: Appointment[]
  metrics: AppointmentMetrics
  uniqueClosers: string[]
  uniqueSetters: string[]
}

class AppointmentsService {
  private readonly TIMEOUT_MS = 30000; // 30 seconds timeout

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number = this.TIMEOUT_MS): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  async getAppointments(filters: AppointmentFilters = {}): Promise<AppointmentsResponse> {
    try {
      // Prepare filters for edge function
      const requestFilters = {
        ...filters,
        dateRange: filters.dateRange ? {
          start: filters.dateRange.start.toISOString().split('T')[0],
          end: filters.dateRange.end.toISOString().split('T')[0]
        } : undefined
      }

      console.log('AppointmentsService: Fetching appointments with filters', requestFilters)

      // Call edge function for appointments with timeout
      const appointmentsPromise = supabaseClient.functions.invoke('get-appointments', {
        body: requestFilters
      })

      const { data: appointmentsData, error: appointmentsError } = await this.withTimeout(appointmentsPromise)

      if (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError)
        throw new Error(`Failed to fetch appointments: ${appointmentsError.message || appointmentsError}`)
      }

      // Call edge function for metrics with timeout
      const metricsPromise = supabaseClient.functions.invoke('get-dashboard-metrics', {
        body: requestFilters
      })

      const { data: metricsData, error: metricsError } = await this.withTimeout(metricsPromise)

      if (metricsError) {
        console.error('Error fetching metrics:', metricsError)
        throw new Error(`Failed to fetch metrics: ${metricsError.message || metricsError}`)
      }

      const result = {
        appointments: appointmentsData?.appointments || [],
        metrics: {
          totalAppointments: metricsData?.totalAppointments || 0,
          totalSits: metricsData?.totalSits || 0,
          totalCloses: metricsData?.totalCloses || 0,
          noShows: metricsData?.noShows || 0,
          rescheduled: metricsData?.rescheduled || 0,
          notInterested: metricsData?.notInterested || 0,
          disqualified: metricsData?.disqualified || 0,
          followUp: metricsData?.followUp || 0,
          pending: metricsData?.pending || 0,
          sitRate: metricsData?.sitRate || 0,
          closeRate: metricsData?.closeRate || 0
        },
        uniqueClosers: appointmentsData?.uniqueClosers || [],
        uniqueSetters: appointmentsData?.uniqueSetters || []
      }

      console.log('AppointmentsService: Successfully fetched', result.appointments.length, 'appointments')
      return result

    } catch (error) {
      console.error('Error in getAppointments:', error)

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('timed out')) {
          throw new Error('Request timed out. Please check your internet connection and try again.')
        }
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Network error. Please check your internet connection.')
        }
        if (error.message.includes('Unauthorized')) {
          throw new Error('Authentication failed. Please log in again.')
        }
      }

      throw error
    }
  }

  private calculateMetrics(appointments: Appointment[]): AppointmentMetrics {
    const total = appointments.length
    
    const sits = appointments.filter(apt => apt.confirmation_disposition === 'Sat').length
    const closes = appointments.filter(apt => apt.confirmation_disposition === 'Closed').length
    const noShows = appointments.filter(apt => apt.confirmation_disposition === 'No Show').length
    const rescheduled = appointments.filter(apt => apt.confirmation_disposition === 'Rescheduled').length
    const notInterested = appointments.filter(apt => apt.confirmation_disposition === 'Not Interested').length
    const disqualified = appointments.filter(apt => apt.confirmation_disposition === 'Disqualified').length
    const followUp = appointments.filter(apt => apt.confirmation_disposition === 'Follow-up').length
    const pending = appointments.filter(apt => apt.confirmation_disposition === 'Pending').length

    const sitRate = total > 0 ? (sits / total) * 100 : 0
    const closeRate = sits > 0 ? (closes / sits) * 100 : 0

    return {
      totalAppointments: total,
      totalSits: sits,
      totalCloses: closes,
      noShows,
      rescheduled,
      notInterested,
      disqualified,
      followUp,
      pending,
      sitRate: Math.round(sitRate * 100) / 100,
      closeRate: Math.round(closeRate * 100) / 100
    }
  }

  async getUniqueClosers(companyId?: string): Promise<string[]> {
    try {
      let query = supabaseClient
        .from('appointments')
        .select('closer_name')

      if (companyId) {
        query = query.eq('company_id', companyId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching closers:', error)
        throw error
      }

      const uniqueClosers = [...new Set(data?.map(item => item.closer_name) || [])].sort()
      return uniqueClosers
    } catch (error) {
      console.error('Error in getUniqueClosers:', error)
      throw error
    }
  }

  async getUniqueSetters(companyId?: string): Promise<string[]> {
    try {
      let query = supabaseClient
        .from('appointments')
        .select('setter_name')

      if (companyId) {
        query = query.eq('company_id', companyId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching setters:', error)
        throw error
      }

      const uniqueSetters = [...new Set(data?.map(item => item.setter_name).filter(Boolean) || [])].sort()
      return uniqueSetters
    } catch (error) {
      console.error('Error in getUniqueSetters:', error)
      throw error
    }
  }
}

export const appointmentsService = new AppointmentsService()
