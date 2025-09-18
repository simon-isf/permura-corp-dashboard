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
  limit?: number
  offset?: number
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
      .order('booked_for', { ascending: false })

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

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit)
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
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

    // Get unique closers and setters for filter options
    let closersQuery = supabaseClient
      .from('appointments')
      .select('closer_name')

    let settersQuery = supabaseClient
      .from('appointments')
      .select('setter_name')

    // Apply company filter for regular users
    if (profile.role !== 'super_admin' && profile.company_id) {
      closersQuery = closersQuery.eq('company_id', profile.company_id)
      settersQuery = settersQuery.eq('company_id', profile.company_id)
    }

    const [closersResult, settersResult] = await Promise.all([
      closersQuery,
      settersQuery
    ])

    const uniqueClosers = [...new Set(
      closersResult.data?.map(item => item.closer_name) || []
    )].sort()

    const uniqueSetters = [...new Set(
      settersResult.data?.map(item => item.setter_name).filter(Boolean) || []
    )].sort()

    return new Response(
      JSON.stringify({
        appointments: appointments || [],
        uniqueClosers,
        uniqueSetters,
        total: appointments?.length || 0
      }),
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
