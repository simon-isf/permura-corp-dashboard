import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface AppointmentFilters {
  dateRange?: {
    start: string
    end: string
  }
  selectedClosers?: string[]
  selectedSetters?: string[]
  selectedCompany?: string
}

interface DashboardMetrics {
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
  appointmentsByDay: Array<{
    date: string
    appointments: number
    sits: number
    closes: number
  }>
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from JWT token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user profile to check role and company
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role, company_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body for filters
    const filters: AppointmentFilters = req.method === 'POST' 
      ? await req.json() 
      : {}

    // Build query with RLS automatically applied
    let query = supabaseClient
      .from('appointments')
      .select('*')

    // Apply date range filter
    if (filters.dateRange) {
      query = query
        .gte('booked_for', filters.dateRange.start)
        .lte('booked_for', filters.dateRange.end)
    }

    // Apply closer filter
    if (filters.selectedClosers && filters.selectedClosers.length > 0) {
      query = query.in('closer_name', filters.selectedClosers)
    }

    // Apply setter filter
    if (filters.selectedSetters && filters.selectedSetters.length > 0) {
      query = query.in('setter_name', filters.selectedSetters)
    }

    // Apply company filter (only for super admins)
    if (profile.role === 'super_admin' && filters.selectedCompany) {
      query = query.eq('company_id', filters.selectedCompany)
    }

    const { data: appointments, error: appointmentsError } = await query

    if (appointmentsError) {
      return new Response(
        JSON.stringify({ error: appointmentsError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Calculate metrics
    const total = appointments?.length || 0
    const sits = appointments?.filter(apt => apt.confirmation_disposition === 'Sat').length || 0
    const closes = appointments?.filter(apt => apt.confirmation_disposition === 'Closed').length || 0
    const noShows = appointments?.filter(apt => apt.confirmation_disposition === 'No Show').length || 0
    const rescheduled = appointments?.filter(apt => apt.confirmation_disposition === 'Rescheduled').length || 0
    const notInterested = appointments?.filter(apt => apt.confirmation_disposition === 'Not Interested').length || 0
    const disqualified = appointments?.filter(apt => apt.confirmation_disposition === 'Disqualified').length || 0
    const followUp = appointments?.filter(apt => apt.confirmation_disposition === 'Follow-up').length || 0
    const pending = appointments?.filter(apt => apt.confirmation_disposition === 'Pending').length || 0

    const sitRate = total > 0 ? (sits / total) * 100 : 0
    const closeRate = sits > 0 ? (closes / sits) * 100 : 0

    // Calculate appointments by day for chart data
    const appointmentsByDay: { [key: string]: { appointments: number, sits: number, closes: number } } = {}
    
    appointments?.forEach(apt => {
      const date = apt.booked_for
      if (!appointmentsByDay[date]) {
        appointmentsByDay[date] = { appointments: 0, sits: 0, closes: 0 }
      }
      appointmentsByDay[date].appointments++
      if (apt.confirmation_disposition === 'Sat') appointmentsByDay[date].sits++
      if (apt.confirmation_disposition === 'Closed') appointmentsByDay[date].closes++
    })

    const appointmentsByDayArray = Object.entries(appointmentsByDay)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const metrics: DashboardMetrics = {
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
      closeRate: Math.round(closeRate * 100) / 100,
      appointmentsByDay: appointmentsByDayArray
    }

    return new Response(
      JSON.stringify(metrics),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
