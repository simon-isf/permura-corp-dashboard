import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabaseClient, Profile, UserRole } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  isAuthenticated: boolean
  isSuperAdmin: boolean
  userCompanyId: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  // Debug flag: enable detailed logs only when explicitly requested
  const DEBUG_AUTH = import.meta.env.MODE === 'development' && import.meta.env.VITE_DEBUG_AUTH === 'true'


  // Circuit breaker for profile fetching
  const profileFetchAttempts = React.useRef<Map<string, number>>(new Map())
  const maxProfileFetchAttempts = 3

  // Deduplicate concurrent profile fetches and keep track of last fetched user
  const inFlightProfileFetches = React.useRef<Map<string, Promise<Profile | null>>>(new Map())
  const lastFetchedUserId = React.useRef<string | null>(null)


  // Fetch user profile from database (deduplicated + timeout)
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    if (DEBUG_AUTH) console.log('🚀 AuthContext: fetchProfile function started')

    // If a fetch for this user is already in-flight, return the same promise
    const existing = inFlightProfileFetches.current.get(userId)
    if (existing) {
      if (DEBUG_AUTH) console.log('♻️ AuthContext: Returning in-flight profile fetch')
      return existing
    }

    const task = (async (): Promise<Profile | null> => {
      try {
        if (DEBUG_AUTH) console.log('🔄 AuthContext: Inside try block')

        // Circuit breaker: prevent infinite profile fetch attempts
        const attempts = profileFetchAttempts.current.get(userId) || 0
        if (DEBUG_AUTH) console.log('🔢 AuthContext: Current attempts:', attempts)

        if (attempts >= maxProfileFetchAttempts) {
          console.error(`🚨 AuthContext: Max profile fetch attempts (${maxProfileFetchAttempts}) reached for user ${userId}`)
          return null
        }

        profileFetchAttempts.current.set(userId, attempts + 1)
        if (DEBUG_AUTH) console.log(`🔍 AuthContext: Fetching profile for user: ${userId} (attempt ${attempts + 1}/${maxProfileFetchAttempts})`)
        if (DEBUG_AUTH) console.log('🔐 AuthContext: Fetching user profile directly')
        if (DEBUG_AUTH) console.log('🔍 AuthContext: Making direct Supabase query for user profile...')

        // Wrap the Supabase request with a timeout to avoid hanging forever
        const withTimeout = <T,>(p: Promise<T>, ms = 6000): Promise<T> =>
          new Promise((resolve, reject) => {
            const id = setTimeout(() => reject(new Error(`fetchProfile timeout after ${ms}ms`)), ms)
            p.then((v) => { clearTimeout(id); resolve(v) }).catch((e) => { clearTimeout(id); reject(e) })
          })

        const { data, error } = await withTimeout(
          supabaseClient.from('profiles').select('*').eq('id', userId).single()
        )

        if (DEBUG_AUTH) console.log('📊 AuthContext: Supabase response:', { data, error })

        if (error) {
          console.error('❌ AuthContext: Error fetching profile:', {
            error,
            code: (error as any).code,
            message: (error as any).message,
            details: (error as any).details,
            hint: (error as any).hint,
            statusCode: (error as any).statusCode || 'unknown'
          })
          return null
        }

        if (DEBUG_AUTH) console.log('✅ AuthContext: Profile fetched successfully:', data)
        // Reset attempts counter on success
        profileFetchAttempts.current.delete(userId)
        lastFetchedUserId.current = userId
        return data as Profile
      } catch (error: any) {
        console.error('❌ AuthContext: Unexpected error fetching profile:', error)
        console.error('❌ AuthContext: Error details:', {
          name: error?.name,
          message: error?.message,
          stack: error?.stack
        })
        return null
      } finally {
        inFlightProfileFetches.current.delete(userId)
      }
    })()

    inFlightProfileFetches.current.set(userId, task)
    return task
  }

  // Initialize auth state
  useEffect(() => {
    if (DEBUG_AUTH) console.log('🚀 AuthContext: Initializing auth state')

    // Get initial session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (DEBUG_AUTH) console.log('📋 AuthContext: Initial session:', session ? 'Found' : 'None')
      setSession(session)
      setUser(session?.user ?? null)

      // Do not block the UI on profile fetch; load app immediately
      setLoading(false)

      if (session?.user) {
        if (DEBUG_AUTH) console.log('👤 AuthContext: Fetching profile for initial session (background)')
        fetchProfile(session.user.id).then((p) => {
          setProfile(p)
          if (DEBUG_AUTH) console.log('✅ AuthContext: Profile fetch completed:', p ? 'Found' : 'Not found')
        })
      } else {
        if (DEBUG_AUTH) console.log('✅ AuthContext: Initial loading complete (no session)')
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (DEBUG_AUTH) console.log('🔔 AuthContext: onAuthStateChange event:', event)
      setSession(session)
      setUser(session?.user ?? null)

      // Skip INITIAL_SESSION to avoid duplicating the initial getSession() work
      if (event === 'INITIAL_SESSION') {
        setLoading(false)
        return
      }

      if (session?.user) {
        fetchProfile(session.user.id).then((userProfile) => {
          setProfile(userProfile)
          if (DEBUG_AUTH) console.log('🔄 AuthContext: Auth state change - profile:', userProfile ? 'Found' : 'Not found')
        })
      } else {
        setProfile(null)
        lastFetchedUserId.current = null
        if (DEBUG_AUTH) console.log('🔄 AuthContext: Auth state change - signed out')
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast({
          title: "Authentication Error",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Welcome back!",
          description: "You have been successfully signed in.",
        })
      }

      return { error }
    } catch (error) {
      const authError = error as AuthError
      toast({
        title: "Authentication Error",
        description: authError.message,
        variant: "destructive",
      })
      return { error: authError }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabaseClient.auth.signOut()

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Signed out",
          description: "You have been successfully signed out.",
        })
      }
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
    isSuperAdmin: profile?.role === 'super_admin',
    userCompanyId: profile?.company_id || null,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
