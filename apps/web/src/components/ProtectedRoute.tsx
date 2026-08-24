import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useSupabase } from '@/context/SupabaseProvider'
import { checkAnyBranchExists } from '@/lib/services/branches'

export default function ProtectedRoute() {
  const { session, profile, profileLoading } = useSupabase()
  const [branchCheckDone, setBranchCheckDone] = useState(false)
  const [anyBranchExists, setAnyBranchExists] = useState(false)

  // If user has no branch_id, check if any branches exist
  const needsBranchCheck = !!session && !profileLoading && profile !== null && profile.branch_id === null

  useEffect(() => {
    if (!needsBranchCheck) {
      setBranchCheckDone(false)
      return
    }

    let cancelled = false
    checkAnyBranchExists()
      .then((exists) => {
        if (!cancelled) {
          setAnyBranchExists(exists)
          setBranchCheckDone(true)
        }
      })
      .catch(() => {
        if (!cancelled) {
          // On error, default to pending-approval (safer than onboarding)
          setAnyBranchExists(true)
          setBranchCheckDone(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [needsBranchCheck])

  // No session → login
  if (!session) {
    return <Navigate to="/login" replace />
  }

  // Still loading profile or branch check
  if (profileLoading || (needsBranchCheck && !branchCheckDone)) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>
  }

  // Profile loaded but no branch_id
  if (profile && profile.branch_id === null) {
    if (anyBranchExists) {
      return <Navigate to="/pending-approval" replace />
    }
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}

