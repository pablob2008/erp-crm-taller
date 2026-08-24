import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface UserProfile {
  id: string
  branch_id: string | null
  role: 'admin' | 'receptionist' | 'technician'
}

export interface SupabaseContextType {
  supabase: typeof supabase
  session: Session | null
  user: User | null
  profile: UserProfile | null
  profileLoading: boolean
  refreshProfile: () => Promise<void>
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  const fetchProfile = useCallback(async (userId: string) => {
    setProfileLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, branch_id, role')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    } else {
      setProfile(data as UserProfile)
    }
    setProfileLoading(false)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }, [user, fetchProfile])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession)
      const currentUser = initialSession?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        fetchProfile(currentUser.id).then(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      const currentUser = newSession?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        fetchProfile(currentUser.id).then(() => setLoading(false))
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>
  }

  const value: SupabaseContextType = {
    supabase,
    session,
    user,
    profile,
    profileLoading,
    refreshProfile,
  }

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}
