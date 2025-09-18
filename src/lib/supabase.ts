import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types based on existing schema
export type UserRole = 'super_admin' | 'user'

export interface Profile {
  id: string
  email: string
  role: UserRole
  company_id: string | null
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  company_id: string
  company_name: string
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  company_id: string
  name: string
  closer_name: string
  booked_for: string
  confirmation_disposition: 'Sat' | 'Rescheduled' | 'Not Interested' | 'Disqualified' | 'Follow-up' | 'Pending' | 'No Show' | 'Closed'
  note: string | null
  phone_number: string | null
  address: string | null
  setter_name: string | null
  setter_number: string | null
  email: string | null
  disposition_date: string | null
  site_survey: string | null
  m1_commission: number | null
  m2_commission: number | null
  contact_link: string | null
  recording_media_link: string | null
  credit_score: string | null
  roof_type: string | null
  existing_solar: boolean | null
  shading: string | null
  appointment_type: string | null
  confirmed: boolean | null
  contact_id: string | null
  created_at: string
  updated_at: string
  row_num: number
  dq_reason: string | null
  system_size: number | null
}

// Database schema type for Supabase client
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      companies: {
        Row: Company
        Insert: Omit<Company, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Company, 'id' | 'created_at' | 'updated_at'>>
      }
      appointments: {
        Row: Appointment
        Insert: Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'row_num'>
        Update: Partial<Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'row_num'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      create_super_admin: {
        Args: {
          email: string
          password: string
          company_id?: string
        }
        Returns: string
      }
      create_user: {
        Args: {
          email: string
          password: string
          role: UserRole
          company_id?: string
        }
        Returns: string
      }
      update_user_profile: {
        Args: {
          user_id: string
          email?: string
          role?: UserRole
          company_id?: string
        }
        Returns: void
      }
    }
    Enums: {
      user_role: UserRole
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Create typed Supabase client
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Export types for use in components
export type { Database }
