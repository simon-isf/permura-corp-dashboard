import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface UserData {
  email: string
  password?: string
  role: 'super_admin' | 'user'
  company_id?: string
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

    // Create admin client for user management
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
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

    // Check if user is super admin
    const { data: isSuperAdmin, error: roleError } = await supabaseClient
      .rpc('current_user_is_super_admin')

    if (roleError || !isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Super admin access required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    switch (req.method) {
      case 'GET': {
        // Get all users with their profiles and company info
        const { data: profiles, error } = await supabaseClient
          .from('profiles')
          .select(`
            id,
            email,
            role,
            company_id,
            created_at,
            updated_at
          `)
          .order('created_at', { ascending: false })

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Get company names for users
        const profilesWithCompanies = await Promise.all(
          profiles.map(async (profile) => {
            if (profile.company_id) {
              const { data: company } = await supabaseClient
                .from('companies')
                .select('company_name')
                .eq('company_id', profile.company_id)
                .single()
              
              return {
                ...profile,
                company_name: company?.company_name || null
              }
            }
            return { ...profile, company_name: null }
          })
        )

        return new Response(
          JSON.stringify(profilesWithCompanies),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      case 'POST': {
        // Create new user
        const userData: UserData = await req.json()

        if (!userData.email || !userData.password || !userData.role) {
          return new Response(
            JSON.stringify({ error: 'email, password, and role are required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Create user using admin client
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true
        })

        if (createError) {
          return new Response(
            JSON.stringify({ error: createError.message }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Create profile
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert([{
            id: newUser.user.id,
            email: userData.email,
            role: userData.role,
            company_id: userData.company_id || null
          }])
          .select()
          .single()

        if (profileError) {
          // If profile creation fails, delete the user
          await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
          return new Response(
            JSON.stringify({ error: profileError.message }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        return new Response(
          JSON.stringify(profile),
          { 
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      case 'PUT': {
        // Update user profile
        const url = new URL(req.url)
        const userId = url.searchParams.get('id')
        
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'User ID is required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Safely parse JSON body (handle empty body)
        const raw = await req.text()
        let updates: Partial<UserData> = {}
        if (raw) {
          try {
            updates = JSON.parse(raw)
          } catch (_) {
            return new Response(
              JSON.stringify({ error: 'Invalid JSON body' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }

        // Build update payload with only provided fields
        const updatePayload: Record<string, any> = {}
        if (typeof updates.role !== 'undefined') updatePayload.role = updates.role
        if (typeof updates.company_id !== 'undefined') updatePayload.company_id = updates.company_id ?? null

        if (Object.keys(updatePayload).length === 0) {
          return new Response(
            JSON.stringify({ error: 'No valid fields to update' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Update profile
        const { data: profile, error } = await supabaseAdmin
          .from('profiles')
          .update(updatePayload)
          .eq('id', userId)
          .select()
          .single()

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        return new Response(
          JSON.stringify(profile),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      case 'DELETE': {
        // Delete user
        const url = new URL(req.url)
        const userId = url.searchParams.get('id')
        
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'User ID is required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Delete user (this will cascade delete the profile due to foreign key)
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        return new Response(
          JSON.stringify({ success: true }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { 
            status: 405, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

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
