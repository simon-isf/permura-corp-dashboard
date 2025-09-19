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
      Deno.env.get('SERVICE_ROLE_KEY') ?? '',
    )

    // Ensure service role key is configured (secrets cannot start with SUPABASE_)
    if (!Deno.env.get('SERVICE_ROLE_KEY')) {
      return new Response(
        JSON.stringify({ error: 'SERVICE_ROLE_KEY not set for admin-users function' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }


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
        try {
          console.log('POST request received for user creation')

          // Create new user
          const userData: UserData = await req.json()
          console.log('Parsed user data:', {
            email: userData.email,
            role: userData.role,
            company_id: userData.company_id,
            hasPassword: !!userData.password
          })

          if (!userData.email || !userData.password || !userData.role) {
            console.log('Missing required fields')
            return new Response(
              JSON.stringify({ error: 'email, password, and role are required' }),
              {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            )
          }

          // Enforce company rules by role at the API boundary
          // - Regular users must have a company_id
          // - Super admins must not be tied to a company (force NULL)
          if (userData.role === 'user' && (!userData.company_id || userData.company_id.trim() === '')) {
            console.log('User role requires company_id but none provided')
            return new Response(
              JSON.stringify({ error: 'company_id is required when role is "user"' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          // For super admins, always set company_id to null
          // For regular users, use the provided company_id (but convert empty strings to null)
          const normalizedCompanyId = userData.role === 'super_admin'
            ? null
            : (userData.company_id && userData.company_id.trim() !== '' ? userData.company_id : null)

          console.log('Normalized company_id:', normalizedCompanyId)

          // Create user using admin client
          console.log('Creating auth user...')
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: userData.email,
            password: userData.password,
            email_confirm: true
          })

          if (createError) {
            console.error('Auth user creation failed:', createError)
            return new Response(
              JSON.stringify({
                error: 'Failed to create auth user',
                details: createError.message,
                code: createError.code || 'unknown'
              }),
              {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            )
          }

          console.log('Auth user created successfully, ID:', newUser.user.id)

          // Create profile
          const profileData = {
            id: newUser.user.id,
            email: userData.email,
            role: userData.role,
            company_id: normalizedCompanyId
          }
          console.log('Creating profile with data:', profileData)

          const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert([profileData], { onConflict: 'id' })
            .select()
            .single()

          if (profileError) {
            console.error('Profile creation failed:', {
              error: profileError,
              message: profileError.message,
              details: profileError.details,
              hint: profileError.hint,
              code: profileError.code
            })

            // If profile creation fails, delete the user
            console.log('Cleaning up auth user due to profile creation failure')
            await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)

            return new Response(
              JSON.stringify({
                error: 'Failed to create user profile',
                details: profileError.message,
                hint: profileError.hint,
                code: profileError.code
              }),
              {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            )
          }

          console.log('Profile upserted successfully:', profile.id)
          return new Response(
            JSON.stringify(profile),
            {
              status: 201,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        } catch (error) {
          console.error('Unexpected error in POST handler:', error)
          return new Response(
            JSON.stringify({
              error: 'Internal server error',
              details: error.message,
              stack: error.stack
            }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
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
